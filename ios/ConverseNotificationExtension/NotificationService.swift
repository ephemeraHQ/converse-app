//
//  NotificationService.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/12/2022.
//

import UserNotifications
import XMTP
import CryptoKit
import Alamofire


func shortAddress(address: String) -> String {
  if (address.count > 7) {
    let prefixStart = address.index(address.startIndex, offsetBy: 0)
    let prefixEnd = address.index(address.startIndex, offsetBy: 3)
    let suffixStart = address.index(address.startIndex, offsetBy: address.count - 4)
    let suffixEnd = address.index(address.startIndex, offsetBy: address.count - 1)
    let prefixRange = prefixStart...prefixEnd
    let suffixRange = suffixStart...suffixEnd
    let prefix = address[prefixRange]
    let suffix = address[suffixRange]
    return "\(prefix)...\(suffix)"
  }
  return address
}

func containsURL(input: String) -> Bool {
  let pattern = "\\b(?:(?:https?|ftp):\\/\\/|www\\.)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?:\\/\\S*)?(?:\\?\\S*)?\\b"
  let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive)
  let matches = regex?.numberOfMatches(in: input, options: [], range: NSRange(location: 0, length: input.utf16.count))
  return matches ?? 0 > 0
}

func isSpam(address: String, message: String, sentViaConverse: Bool) -> Bool {
  if (address.hasPrefix("0x0000") && address.hasSuffix("0000"))
      || containsURL(input: message)
      || !sentViaConverse {
    return true
  } else {
    return false
  }
}

func handleNotificationAsync(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  initSentry()
  var shouldIncrementBadge = false
  var messageId = "";
  
  if let bestAttemptContent = bestAttemptContent {    
    if var body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String, let encodedMessage = body["message"] as? String, let account = body["account"] as? String {
      print("Received a notification for account \(account)")
      
      // Let's subscribe to that specific topic
      let mmkv = getMmkv()
      var apiURI = mmkv?.string(forKey: "api-uri")
      // TODO => remove shared defaults
      if (apiURI == nil) {
        let sharedDefaults = try! SharedDefaults()
        apiURI = sharedDefaults.string(forKey: "api-uri")?.replacingOccurrences(of: "\"", with: "")
      }
      let pushToken = getKeychainValue(forKey: "PUSH_TOKEN")
      
      let accounts = getAccounts()
      if (!accounts.contains(account)) {
        print("Account \(account) is not in store")
        contentHandler(UNNotificationContent())
        return
      }
      
      let xmtpClient = await getXmtpClient(account: account);
      if (xmtpClient != nil) {        
        let encryptedMessageData = Data(base64Encoded: Data(encodedMessage.utf8))!
        let envelope = XMTP.Envelope.with { envelope in
          envelope.message = encryptedMessageData
          envelope.contentTopic = contentTopic
        }
        if (isIntroTopic(topic: contentTopic)) {
          return
        } else if (isInviteTopic(topic: contentTopic)) {
          let conversation = await handleNewConversation(xmtpClient: xmtpClient!, envelope: envelope)
          if (conversation != nil && conversation?.peerAddress != nil) {
            do {
              var attempts = 0
              while attempts < 4 { // 4 attempts * 5s = 20s
                if let messages = try! await conversation?.messages(), !messages.isEmpty {
                  let message = messages[0]
                  let messageContent = String(data: message.encodedContent.content, encoding: .utf8) ?? "New message"
                  
                  bestAttemptContent.title = shortAddress(address: conversation!.peerAddress)
                  bestAttemptContent.body = messageContent
                  body["topic"] = conversation?.topic
                  bestAttemptContent.userInfo.updateValue(body, forKey: "body")
                  messageId = messages[0].id
                  
                  if (isSpam(address: conversation!.peerAddress,
                             message: messageContent,
                             sentViaConverse:message.sentViaConverse)) {
                    print("[NotificationExtension] Not showing a notification because considered spam")
                    break
                  } else {
                    subscribeToTopic(apiURI: apiURI, account: xmtpClient!.address, pushToken: pushToken, topic: conversation!.topic)
                  }
                  
                  shouldIncrementBadge = true
                  break
                }
                
                // Wait for 5 seconds before the next attempt
                _ = try? await Task.sleep(nanoseconds: UInt64(5 * 1_000_000_000)) // 5s in nanoseconds
                attempts += 1
              }
            } catch {
              sentryTrackMessage(message: "NOTIFICATION_DECODING_ERROR", extras: ["error": error, "envelope": envelope])
              print("[NotificationExtension] ERROR WHILE DECODING \(error)")
            }
          }
        } else {
          var conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
          let sentViaConverse = body["sentViaConverse"] as? Bool ?? false;
          let decodedMessageResult = await decodeConversationMessage(xmtpClient: xmtpClient!, envelope: envelope, sentViaConverse: sentViaConverse)
          if (decodedMessageResult.senderAddress == xmtpClient?.address || decodedMessageResult.forceIgnore) {
            // Message is from me or a reaction removal, let's drop it
            print("[NotificationExtension] Not showing a notification")
            contentHandler(UNNotificationContent())
            return
          } else if (decodedMessageResult.content != nil) {
            bestAttemptContent.body = decodedMessageResult.content!;
            messageId = decodedMessageResult.id!
            if (conversationTitle.count == 0 && decodedMessageResult.senderAddress != nil) {
              conversationTitle = shortAddress(address: decodedMessageResult.senderAddress!)
            }
            bestAttemptContent.title = conversationTitle;
            shouldIncrementBadge = true
          }
        }
      } else {
        print("[NotificationExtension] Not showing a notification because no client found")
        contentHandler(UNNotificationContent())
        return;
      }
    }
    
    let showNotification = shouldShowNotification(for: messageId)
    
    if (shouldIncrementBadge && showNotification) {
      incrementBadge(for: bestAttemptContent)
      contentHandler(bestAttemptContent)
    } else {
      contentHandler(UNNotificationContent())
      return;
    }
  }
}

class NotificationService: UNNotificationServiceExtension {
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    Task {
      await handleNotificationAsync(contentHandler: contentHandler, bestAttemptContent: bestAttemptContent);
    }
  }
  
  override func serviceExtensionTimeWillExpire() {
    // If it took too much time we can at least show the right title
    sentryTrackMessage(message: "NOTIFICATION_TIMEOUT", extras: nil)
    if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
      if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String {
        let conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
        bestAttemptContent.title = conversationTitle;
        incrementBadge(for: bestAttemptContent)
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
}
