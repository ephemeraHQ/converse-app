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

func hasForbiddenPattern(address: String) -> Bool {
  return address.hasPrefix("0x0000") && address.hasSuffix("0000");
}

func incrementBadge(for content: UNMutableNotificationContent) {
    let newBadgeCount = getBadge() + 1
    setBadge(newBadgeCount)
    content.badge = NSNumber(value: newBadgeCount)
}

func handleNotificationAsync(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  initSentry()
  var shouldIncrementBadge = false
  
  if let bestAttemptContent = bestAttemptContent {    
    if var body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String, let encodedMessage = body["message"] as? String, let account = body["account"] as? String {
      print("Received a notification for account \(account)")
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
          // For now, we don't notifications for new convo anymore at all, they all
          // go to requests. In the future we will improve and subscribe to
          // some topics depending on criteria
          print("[NotificationExtension] Not showing a notification for new convo")
          contentHandler(UNNotificationContent())
          return
//          if (conversation != nil && conversation?.peerAddress != nil) {
//            // For now, we don't notifications for new convo anymore at all, they all
//            // go to requests. In the future we will improve and subscribe to
//            // some topics depending on criteria
//            if (hasForbiddenPattern(address: conversation!.peerAddress)) {
//              print("[NotificationExtension] Not showing a notification because forbidden spammy address")
//              contentHandler(UNNotificationContent())
//              return
//            }
//            bestAttemptContent.title = shortAddress(address: conversation!.peerAddress)
//            body["newConversationTopic"] = conversation?.topic
//            bestAttemptContent.userInfo.updateValue(body, forKey: "body")
//            shouldIncrementBadge = true
//          }
        } else {
          var conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
          let sentViaConverse = body["sentViaConverse"] as? Bool ?? false;
          let decodedMessageResult = await decodeConversationMessage(xmtpClient: xmtpClient!, envelope: envelope, sentViaConverse: sentViaConverse)
          if (decodedMessageResult.senderAddress == xmtpClient?.address || decodedMessageResult.forceIgnore || hasForbiddenPattern(address: decodedMessageResult.senderAddress!)) {
            // Message is from me or a reaction removal or a forbidden address, let's drop it
            print("[NotificationExtension] Not showing a notification")
            contentHandler(UNNotificationContent())
            return
          } else if (decodedMessageResult.content != nil) {
            bestAttemptContent.body = decodedMessageResult.content!;
            if (conversationTitle.count == 0 && decodedMessageResult.senderAddress != nil) {
              conversationTitle = shortAddress(address: decodedMessageResult.senderAddress!)
            }
          }
          bestAttemptContent.title = conversationTitle;
          shouldIncrementBadge = true
        }
      } else {
        print("[NotificationExtension] Not showing a notification because no client found")
        contentHandler(UNNotificationContent())
        return;
      }
    }
    
    if shouldIncrementBadge {
      incrementBadge(for: bestAttemptContent)
    }
    
    contentHandler(bestAttemptContent)
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
