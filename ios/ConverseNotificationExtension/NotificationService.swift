//
//  NotificationService.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/12/2022.
//

import UserNotifications
import XMTP
import CryptoKit
import Intents

func handleNotificationAsync(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  initSentry()
  var shouldShowNotification = false
  var messageId: String? = nil
  var messageIntent: INSendMessageIntent? = nil
  
  if var content = bestAttemptContent {
    guard let body = content.userInfo["body"] as? [String: Any],
          let contentTopic = body["contentTopic"] as? String,
          let encodedMessage = body["message"] as? String,
          let account = body["account"] as? String else {
       return await handleConverseNotification(contentHandler: contentHandler, bestAttemptContent: bestAttemptContent)
    }
    
    sentryAddBreadcrumb(message: "Received a notification for account \(account)")
    let apiURI = getApiURI()
    let pushToken = getKeychainValue(forKey: "PUSH_TOKEN")
    let accounts = getAccounts()
    
    guard accounts.contains(account) else {
      print("Account \(account) is not in store")
      contentHandler(UNNotificationContent())
      return
    }
    
    if let xmtpClient = await getXmtpClient(account: account), !isIntroTopic(topic: contentTopic) {
      
    if isV3WelcomeTopic(topic: contentTopic) {
        guard let conversation = await getNewConversation(xmtpClient: xmtpClient, contentTopic: contentTopic) else {
          contentHandler(UNNotificationContent())
          return
        }
        
        (shouldShowNotification, messageId) = await handleV3Welcome(
          xmtpClient: xmtpClient,
          apiURI: apiURI,
          pushToken: pushToken,
          conversation: conversation,
          welcomeTopic: contentTopic,
          bestAttemptContent: &content
        )
    } else if isV3MessageTopic(topic: contentTopic) {
        let encryptedMessageData = Data(base64Encoded: Data(encodedMessage.utf8))!
        let envelope = XMTP.Xmtp_MessageApi_V1_Envelope .with { envelope in
          envelope.message = encryptedMessageData
          envelope.contentTopic = contentTopic
        }
        (shouldShowNotification, messageId, messageIntent) = await handleV3Message(xmtpClient: xmtpClient, envelope: envelope, apiURI: apiURI, bestAttemptContent: &content)
      } else {
        sentryAddBreadcrumb(message: "topic \(contentTopic) is not invite topic")
      }
    }
    
    if (shouldShowNotification && !notificationAlreadyShown(for: messageId)) {
      incrementBadge(for: content)
      guard let intent = messageIntent else {
        contentHandler(content)
        return
      }
      // Handling Communication Notifications
      let interaction = INInteraction(intent: intent, response: nil)
      interaction.direction = .incoming
      do {
        if #available(iOSApplicationExtension 15.0, *) {
          try await interaction.donate()
          let contentWithIntent = try content.updating(from: intent)
          contentHandler(contentWithIntent)
        } else {
          contentHandler(content)
        }
      } catch {
        contentHandler(content)
      }
    } else {
      cancelNotification(contentHandler: contentHandler)
      return
    }
  }
}

func handleConverseNotification(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  if var content = bestAttemptContent {
    guard let data = content.userInfo as? [String: Any] else {
      contentHandler(UNNotificationContent())
      return
    }
    guard let type = data["type"] as? String else {
      contentHandler(UNNotificationContent())
      return
    }
    
    // Handle the notification based on type with switch case
    switch type {
    case "group_join_request":
      guard let groupInviteId = data["groupInviteId"] as? String,
            let joinRequestId = data["joinRequestId"] as? String,
            let address = data["address"] as? String,
            let account = data["account"] as? String else {
        contentHandler(UNNotificationContent())
        return
      }
      let shouldShowNotification = await handleGroupJoinRequestNotification(
        groupInviteId: groupInviteId,
        joinRequestId: joinRequestId,
        address: address,
        account: account,
        content: content
      )
      if (shouldShowNotification) {
        contentHandler(content)
      } else {
        contentHandler(UNNotificationContent())
      }
      break
    case "group_sync":
      guard let contentTopic = data["contentTopic"] as? String,
            let account = data["account"] as? String else {
        contentHandler(UNNotificationContent())
        return
      }
      await handleGroupSyncNotification(
        contentTopic: contentTopic,
        account: account
      )
      contentHandler(UNNotificationContent())
      break
    default:
      contentHandler(UNNotificationContent())
      return
    }
    
  }
  
  func handleGroupJoinRequestNotification(groupInviteId: String, joinRequestId: String, address: String, account: String, content: UNMutableNotificationContent) async -> Bool {
    do {
      let mmkv = getMmkv()
      if let xmtpClient = await getXmtpClient(account: account) {
        guard let groupId = mmkv?.string(forKey: "group-invites-link-\(groupInviteId)") else {
          // Don't handle this as it's stored on a different device
          return false // Do not show notification
        }
        var apiURI = mmkv?.string(forKey: "api-uri")
        if (apiURI == nil) {
          let sharedDefaults = try! SharedDefaults()
          apiURI = sharedDefaults.string(forKey: "api-uri")?.replacingOccurrences(of: "\"", with: "")
        }
        do {
          if let group = await getGroup(xmtpClient: xmtpClient, groupId: groupId), let apiURI = apiURI {
            try await group.addMembers(addresses: [address])
            try await putGroupInviteRequest(apiURI: apiURI, account: account, xmtpClient: xmtpClient, status: "ACCEPTED", joinRequestId: joinRequestId)
            return false // Do not show notification when successfully added
          }
        } catch {
          sentryTrackError(error: error, extras: ["message": "Could not add member to group"])
          return true // Show notification if any of these errors occurs
        }
      } else {
        sentryTrackMessage(message: "No client found for account", extras: ["account": account])
      }
    } catch {
      sentryTrackError(error: error, extras: ["message": "Could not get or sync group"])
    }
    return false // Do not show notification if any error occurs, could not have the client or mmkv
  }

  func handleGroupSyncNotification(contentTopic: String, account: String) async {
    do {
      let groupId = getV3IdFromTopic(topic: contentTopic)
      let mmkv = getMmkv()
      if let xmtpClient = await getXmtpClient(account: account) {
        if let group = await getGroup(xmtpClient: xmtpClient, groupId: groupId) {
          try await group.sync()
        } else {
          sentryTrackMessage(message: "Group not found", extras: ["groupId": groupId, "account": account])
        }
      } else {
        sentryTrackMessage(message: "No client found for account", extras: ["account": account])
      }
    } catch {
      sentryTrackError(error: error, extras: ["message": "Could not sync group"])
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
    sentryTrackMessage(message: "NOTIFICATION_TIMEOUT", extras: ["body": bestAttemptContent?.userInfo["body"]])
    if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
      if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String {
        incrementBadge(for: bestAttemptContent)
      }
      contentHandler(bestAttemptContent)
    }
  }
}

