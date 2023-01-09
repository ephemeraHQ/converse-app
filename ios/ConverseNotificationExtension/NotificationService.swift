//
//  NotificationService.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/12/2022.
//

import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    let sharedDefaults = UserDefaults(suiteName: "group.com.converse")
    
    
    if let bestAttemptContent = bestAttemptContent {
      
      if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String {
        let conversationDictString = sharedDefaults?.string(forKey: "conversation-\(contentTopic)")
        if let data = conversationDictString?.data(using: .utf8) {
          do {
            if let conversationDict = try JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] {
              let shortAddress = conversationDict["shortAddress"]
              let lensHandle = conversationDict["lensHandle"]
              let ensName = conversationDict["ensName"]
              bestAttemptContent.title = "\(lensHandle ?? (ensName ?? (shortAddress ?? bestAttemptContent.title)))"
            }
          } catch {
          }
        }
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
  override func serviceExtensionTimeWillExpire() {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
      contentHandler(bestAttemptContent)
    }
  }
  
}
