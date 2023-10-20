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

func handleNotificationAsync(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  initSentry()
  var shouldShowNotification = false
  var messageId: String? = nil
  
  if var content = bestAttemptContent {
    guard let body = content.userInfo["body"] as? [String: Any],
          let contentTopic = body["contentTopic"] as? String,
          let encodedMessage = body["message"] as? String,
          let account = body["account"] as? String else { return }
    
    print("Received a notification for account \(account)")
    
    let apiURI = getApiURI()
    let pushToken = getKeychainValue(forKey: "PUSH_TOKEN")
    let accounts = getAccounts()
    
    guard accounts.contains(account) else {
      print("Account \(account) is not in store")
      contentHandler(UNNotificationContent())
      return
    }
    
    if let xmtpClient = await getXmtpClient(account: account), !isIntroTopic(topic: contentTopic) {
      if isInviteTopic(topic: contentTopic) {
        guard let conversation = await getNewConversationFromEnvelope(
          xmtpClient: xmtpClient,
          contentTopic: contentTopic,
          encodedMessage: encodedMessage
        ) else {
          return
        }
        
        (shouldShowNotification, messageId) = await handleNewConversationFirstMessage(
          xmtpClient: xmtpClient,
          apiURI: apiURI,
          pushToken: pushToken,
          conversation: conversation,
          bestAttemptContent: &content
        )
      } else {
        let encryptedMessageData = Data(base64Encoded: Data(encodedMessage.utf8))!
        let envelope = XMTP.Envelope.with { envelope in
          envelope.message = encryptedMessageData
          envelope.contentTopic = contentTopic
        }
        
        (shouldShowNotification, messageId) = await handleOngoingConversationMessage(
          xmtpClient: xmtpClient,
          envelope: envelope,
          bestAttemptContent: &content,
          body: body
        )
      }
    }
    
    if (shouldShowNotification && !notificationAlreadyShown(for: messageId)) {
      incrementBadge(for: content)
      contentHandler(content)
    } else {
      contentHandler(UNNotificationContent())
      return
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
