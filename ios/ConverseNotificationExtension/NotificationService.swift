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

func handleNotificationAsync(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  
  if let bestAttemptContent = bestAttemptContent {
    
    print("[NotificationExtension] Received a notification")
    if var body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String, let encodedMessage = body["message"] as? String {
      
      let xmtpClient = await getXmtpClientFromKeys();
      
      if (xmtpClient != nil) {
        
        let encryptedMessageData = Data(base64Encoded: Data(encodedMessage.utf8))!
        let envelope = XMTP.Envelope.with { envelope in
          envelope.message = encryptedMessageData
          envelope.contentTopic = contentTopic
        }
        
        if (isIntroTopic(topic: contentTopic) || isInviteTopic(topic: contentTopic)) {
          let conversation = handleNewConversation(xmtpClient: xmtpClient!, envelope: envelope)
          if (conversation != nil && conversation?.peerAddress != nil) {
            bestAttemptContent.title = shortAddress(address: conversation!.peerAddress)
            body["newConversationTopic"] = conversation?.topic
            bestAttemptContent.userInfo.updateValue(body, forKey: "body")
          }
        } else {
          var conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
          let sentViaConverse = body["sentViaConverse"] as? Bool ?? false;
          let decodedMessageResult = await decodeConversationMessage(xmtpClient: xmtpClient!, envelope: envelope, sentViaConverse: sentViaConverse)
          if (decodedMessageResult.senderAddress == xmtpClient?.address || decodedMessageResult.forceIgnore) {
            // Message is from me or a reaction removal, let's ignore it
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
        }
      }
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
    if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
      if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String {
        let conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
        bestAttemptContent.title = conversationTitle;
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
}
