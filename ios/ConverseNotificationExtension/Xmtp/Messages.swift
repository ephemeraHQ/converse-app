//
//  Messages.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import Alamofire
import Intents


func handleV3Welcome(xmtpClient: XMTP.Client, apiURI: String?, pushToken: String?, conversation: XMTP.Conversation, welcomeTopic: String, bestAttemptContent: inout UNMutableNotificationContent) async -> (shouldShowNotification: Bool, messageId: String?) {
  var shouldShowNotification = false
  let messageId = "welcome-" + conversation.topic
  do {
    // group is already synced in getNewGroup method
    let spamScore = await computeSpamScoreV3Welcome(client: xmtpClient, conversation: conversation, apiURI: apiURI)
    if spamScore < 0 { // Message is going to main inbox
      // Consent list is loaded in computeSpamScoreGroupWelcome
      let convoAllowed = try await xmtpClient.preferences.conversationState(conversationId: conversation.id) == .allowed
      let convoDenied = try await xmtpClient.preferences.conversationState(conversationId: conversation.id) == .denied
      // If group is already consented (either way) then don't show a notification for welcome as this will likely be a second+ installation
      if !convoAllowed && !convoDenied {
        
        shouldShowNotification = true
        if case .group(let group) = conversation {
          let groupName = try group.groupName()
          bestAttemptContent.title = groupName
          bestAttemptContent.body = "You have been added to a new group"
        } else if case .dm(let dm) = conversation {
          bestAttemptContent.title = "New DM"
          bestAttemptContent.body = "You have a new direct message"
        }

      } else {
        shouldShowNotification = false
      }
    } else if spamScore == 0 { // Message is Request
      shouldShowNotification = false
      trackNewRequest()
    } else { // Message is Spam
      shouldShowNotification = false
    }
    
  } catch {
    sentryTrackError(error: error, extras: ["message": "NOTIFICATION_SAVE_MESSAGE_ERROR_3", "topic": conversation.topic])
    print("[NotificationExtension] Error handling group invites: \(error)")
  }
  
  return (shouldShowNotification, messageId)
}

func handleV3Message(xmtpClient: XMTP.Client, envelope: XMTP.Xmtp_MessageApi_V1_Envelope, apiURI: String?, bestAttemptContent: inout UNMutableNotificationContent) async -> (shouldShowNotification: Bool, messageId: String?, messageIntent: INSendMessageIntent?) {
  var shouldShowNotification = false
  let contentTopic = envelope.contentTopic
  var messageId: String? = nil
  var messageIntent: INSendMessageIntent? = nil
  
  do {
    
    if let conversation = try await xmtpClient.findConversationByTopic(topic: envelope.contentTopic) {
      try await conversation.sync()
      if var decodedMessage = try? await decodeMessage(xmtpClient: xmtpClient, envelope: envelope) {
        // For now, use the group member linked address as "senderAddress"
        // @todo => make inboxId a first class citizen
        if let senderAddresses = try await conversation.members().first(where: {$0.inboxId == decodedMessage.senderInboxId})?.addresses {
          // This is a bit yucky since we are doing some gymnastics around inboxId vs address.
          // Will have a fast follow if we see any issues with push
          decodedMessage.senderInboxId = senderAddresses[0]
        }

        let decodedMessageResult = handleMessageByContentType(decodedMessage: decodedMessage, xmtpClient: xmtpClient);
        messageId = decodedMessageResult.id
        if decodedMessageResult.senderAddress?.lowercased() == xmtpClient.inboxID.lowercased() || decodedMessageResult.senderAddress?.lowercased() == xmtpClient.address.lowercased() || decodedMessageResult.forceIgnore {
        } else {
          let spamScore = await computeSpamScoreV3Message(client: xmtpClient, conversation: conversation, decodedMessage: decodedMessage, apiURI: apiURI)
          
          if spamScore < 0 { // Message is going to main inbox
            shouldShowNotification = true
            if case .group(let group) = conversation {
              if let groupName = try? group.groupName() {
                bestAttemptContent.title = groupName
              }
              // We replaced decodedMessage.senderAddress from inboxId to actual address
              // so it appears well in the app until inboxId is a first class citizen
              if let senderProfileSocials = await getProfile(account: xmtpClient.address, address: decodedMessage.senderInboxId) {
                bestAttemptContent.subtitle = getPreferredName(address: decodedMessage.senderInboxId, socials: senderProfileSocials)
              }

              if let content = decodedMessageResult.content {
                bestAttemptContent.body = content
              }
              let groupImage = try? group.groupImageUrlSquare()
              messageIntent = getIncomingGroupMessageIntent(group: group, content: bestAttemptContent.body, senderId: decodedMessage.senderInboxId, senderName: bestAttemptContent.subtitle)
            } else if case .dm(let dm) = conversation {
              var senderAvatar: String? = nil
              if let senderProfileSocials = await getProfile(account: xmtpClient.address, address: decodedMessage.senderInboxId) {
                bestAttemptContent.title = getPreferredName(address: decodedMessage.senderInboxId, socials: senderProfileSocials)
                senderAvatar = getPreferredAvatar(socials: senderProfileSocials)
              }
              if let content = decodedMessageResult.content {
                bestAttemptContent.body = content
              }
              messageIntent = getIncoming1v1MessageIntent(
                topic: contentTopic,
                senderId: decodedMessage.senderInboxId,
                senderName: bestAttemptContent.title,
                senderAvatar: senderAvatar, content: bestAttemptContent.body
              )
            }
            
          } else if spamScore == 0 { // Message is Request
            shouldShowNotification = false
          } else { // Message is Spam
            shouldShowNotification = false
          }
        }
      }
    }
  } catch {
    sentryTrackError(error: error, extras: ["message": "NOTIFICATION_SAVE_MESSAGE_ERROR_4", "topic": contentTopic])
    print("[NotificationExtension] Error handling group message: \(error)")
    
  }
  return (shouldShowNotification, messageId, messageIntent)
}

func loadSavedMessages() -> [SavedNotificationMessage] {
  let mmkv = getMmkv()
  let savedMessagesString = mmkv?.string(forKey: "saved-notifications-messages")
  if (savedMessagesString == nil) {
    return []
  } else {
    let decoder = JSONDecoder()
    do {
      let decoded = try decoder.decode([SavedNotificationMessage].self, from: savedMessagesString!.data(using: .utf8)!)
      return decoded
    } catch {
      return []
    }
  }
}

func decodeMessage(xmtpClient: XMTP.Client, envelope: XMTP.Xmtp_MessageApi_V1_Envelope) async throws -> DecodedMessage? {
  // If topic is MLS, the conversation should already be there
  // @todo except if it's new convo => call sync before?
  if (isV3MessageTopic(topic: envelope.contentTopic)) {
    if let conversation = try! await xmtpClient.findConversationByTopic(topic: envelope.contentTopic) {
      do {
        sentryAddBreadcrumb(message: "[NotificationExtension] Syncing Group")
        try await conversation.sync()
        sentryAddBreadcrumb(message: "[NotificationExtension] Decoding group message...")
        let messageBytes = envelope.message
        let message = try await conversation.processMessage(messageBytes: messageBytes)
        let decodedMessage = try message.decode()
        sentryAddBreadcrumb(message:"[NotificationExtension] Group message decoded!")
        return decodedMessage
      } catch {
        sentryTrackMessage(message: "NOTIFICATION_DECODING_ERROR", extras: ["error": error, "envelope": envelope])
        sentryAddBreadcrumb(message: "[NotificationExtension] ERROR WHILE DECODING \(error)")
        return nil
      }
    } else {
      sentryTrackMessage(message: "NOTIFICATION_GROUP_NOT_FOUND", extras: ["envelope": envelope])
      return nil
    }
  }
  return nil
}

func handleMessageByContentType(decodedMessage: DecodedMessage, xmtpClient: XMTP.Client) -> (content: String?, senderAddress: String?, forceIgnore: Bool, id: String?) {
  var contentType = getContentTypeString(type: decodedMessage.encodedContent.type)
  var contentToReturn: String?
  var contentToSave: String?
  var referencedMessageId: String?
  var forceIgnore = false
  
  var messageContent = try? decodedMessage.content() as Any
  
  if (contentType.starts(with: "xmtp.org/reply:")) {
    let replyContent = messageContent as? Reply
    if let reply = replyContent {
      referencedMessageId = reply.reference
      contentType = getContentTypeString(type: reply.contentType)
      messageContent = reply.content
    }
    
  }
  
  do {
    switch contentType {
      
    case let type where type.starts(with: "xmtp.org/text:"):
      contentToSave = messageContent as? String
      contentToReturn = contentToSave
      
    case let type where type.starts(with: "xmtp.org/remoteStaticAttachment:"):
      let remoteAttachment = messageContent as! RemoteAttachment
      contentToSave = getJsonRemoteAttachment(remoteAttachment: remoteAttachment)
      contentToReturn = "📎 Media"
      
    case let type where type.starts(with: "xmtp.org/transactionReference:") ||
      type.starts(with: "coinbase.com/coinbase-messaging-payment-activity:"):
      contentToSave = messageContent as? String
      contentToReturn = "💸 Transaction"
      
    case let type where type.starts(with: "xmtp.org/reaction:"):
      let reaction = messageContent as? Reaction
      let action = reaction?.action.rawValue
      let schema = reaction?.schema.rawValue
      let content = reaction?.content
      referencedMessageId = reaction?.reference
      
      if action == "removed" {
        forceIgnore = true
      } else if action != "removed" && schema == "unicode", let reactionContent = content {
        contentToReturn = "Reacted \(reactionContent) to a message"
      } else {
        contentToReturn = "Reacted to a message"
      }
      
      // For groups: notify reactions to messages from me only
      if (isV3MessageTopic(topic: decodedMessage.topic) && referencedMessageId != nil) {
        forceIgnore = !(try isGroupMessageFromMe(xmtpClient: xmtpClient, messageId: referencedMessageId!))
      }
      
      
      if let validReaction = reaction {
        contentToSave = getJsonReaction(reaction: validReaction)
      } else {
        contentToSave = nil
      }
      
    case let type where type.starts(with: "xmtp.org/readReceipt:"):
      contentToSave = nil
      
    default:
      sentryTrackMessage(message: "NOTIFICATION_UNKNOWN_CONTENT_TYPE", extras: ["contentType": contentType, "topic": decodedMessage.topic])
      print("[NotificationExtension] UNKOWN CONTENT TYPE: \(contentType)")
      return (nil, decodedMessage.senderInboxId, false, nil)
    }
    
    if (isDebugAccount(account: xmtpClient.address)) {
      sentryAddBreadcrumb(message: "Finished handling message content - \(contentToReturn ?? "EMPTY") - tosave \(contentToSave ?? "EMPTY")")
    }

    return (contentToReturn, decodedMessage.senderInboxId, forceIgnore, decodedMessage.id)
  } catch {
    let errorType = contentType.split(separator: "/").last ?? "UNKNOWN"
    sentryTrackError(error: error, extras: ["message": "NOTIFICATION_\(errorType)_ERROR", "topic": decodedMessage.topic])
    return (nil, nil, false, nil)
  }
}

func getContentTypeString(type: ContentTypeID) -> String {
  return "\(type.authorityID)/\(type.typeID):\(type.versionMajor).\(type.versionMinor)"
}

func getJsonRemoteAttachment(remoteAttachment: RemoteAttachment) -> String? {
  do {
    let dictionary = NSDictionary(dictionary: ["url": remoteAttachment.url, "contentDigest": remoteAttachment.contentDigest, "secret": remoteAttachment.secret.base64EncodedString(), "salt": remoteAttachment.salt.base64EncodedString(), "nonce": remoteAttachment.nonce.base64EncodedString(), "scheme": remoteAttachment.scheme.rawValue, "contentLength": remoteAttachment.contentLength ?? 0, "filename": remoteAttachment.filename ?? ""])
    let jsonData = try JSONSerialization.data(withJSONObject: dictionary, options: [])
    let jsonString = String(data: jsonData, encoding: .utf8)
    return jsonString
  } catch {
    print("Error converting dictionary to JSON string: \(error.localizedDescription)")
    return nil
  }
}

func getJsonReaction(reaction: Reaction) -> String? {
  do {
    let reference = reaction.reference;
    let schema = reaction.schema.rawValue;
    let action = reaction.action.rawValue;
    let content = reaction.content;
    let dictionary = NSDictionary(dictionary: ["reference": reference, "action": action, "content": content, "schema": schema])
    let jsonData = try JSONSerialization.data(withJSONObject: dictionary, options: [])
    let jsonString = String(data: jsonData, encoding: .utf8)
    return jsonString
  } catch {
    print("Error converting dictionary to JSON string: \(error.localizedDescription)")
    return nil
  }
}

func isGroupMessageFromMe(xmtpClient: Client, messageId: String) throws -> Bool {
  if let message = try xmtpClient.findMessage(messageId: messageId) {
    return message.decodeOrNull()?.senderInboxId == xmtpClient.inboxID
  } else {
    return false
  }
}
