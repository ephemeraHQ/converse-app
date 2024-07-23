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

func handleNewConversationFirstMessage(xmtpClient: XMTP.Client, apiURI: String?, pushToken: String?, conversation: XMTP.Conversation, bestAttemptContent: inout UNMutableNotificationContent) async -> (shouldShowNotification: Bool, messageId: String?) {
  // @todo => handle new group first messages?
  var shouldShowNotification = false
  var attempts = 0
  var messageId: String? = nil
  
  while attempts < 5 { // 5 attempts * 4s = 20s
    do {
      let messages = try await conversation.messages(limit: 1, direction: .ascending)
      if !messages.isEmpty {
        let message = messages[0]
        messageId = message.id
        let contentType = getContentTypeString(type: message.encodedContent.type)
        
        var messageContent: String? = nil
        if (contentType.starts(with: "xmtp.org/text:")) {
          messageContent = String(data: message.encodedContent.content, encoding: .utf8)
        }
        
        // @todo => handle group messages here (conversation.peerAddress)
        let spamScore = try await computeSpamScoreConversation(
          address: conversation.peerAddress,
          message: messageContent,
          contentType: contentType,
          apiURI: apiURI
        )
        
        do {
          if case .v2(let conversationV2) = conversation {
            try saveConversation(
              account: xmtpClient.address,
              topic: conversationV2.topic,
              peerAddress: conversationV2.peerAddress,
              createdAt: Int(conversationV2.createdAt.timeIntervalSince1970 * 1000),
              context: ConversationContext(
                conversationId: conversationV2.context.conversationID,
                metadata: conversationV2.context.metadata
              ),
              spamScore: spamScore
            )
          }
          let decodedMessageResult = handleMessageByContentType(decodedMessage: message, xmtpClient: xmtpClient);
          
          if decodedMessageResult.senderAddress == xmtpClient.address || decodedMessageResult.forceIgnore {
            // Message is from me or a reaction removal, let's drop it
            print("[NotificationExtension] Not showing a notification")
            break
          } else if let content = decodedMessageResult.content {
            bestAttemptContent.title = shortAddress(address: try conversation.peerAddress)
            bestAttemptContent.body = content
            shouldShowNotification = true
            messageId = decodedMessageResult.id // @todo probably remove this?
            if let body = bestAttemptContent.userInfo["body"] as? [String: Any] {
              var updatedBody = body
              updatedBody["contentTopic"] = conversation.topic
              bestAttemptContent.userInfo.updateValue(updatedBody, forKey: "body")
            }
          }
        } catch {
          sentryTrackError(error: error, extras: ["message": "NOTIFICATION_SAVE_MESSAGE_ERROR_1", "topic": conversation.topic])
          print("[NotificationExtension] ERROR WHILE SAVING MESSAGE \(error)")
          attempts += 1
          continue
        }
        if spamScore >= 1 {
          print("[NotificationExtension] Not showing a notification because considered spam")
          shouldShowNotification = false
        } else {
          // Let's import the conversation so we can get hmac keys
          try await xmtpClient.conversations.importTopicData(data: conversation.toTopicData())
          var request = Xmtp_KeystoreApi_V1_GetConversationHmacKeysRequest()
          request.topics = [conversation.topic]
          let hmacKeys = await xmtpClient.conversations.getHmacKeys(request: request);
          let conversationHmacKeys = try hmacKeys.hmacKeys[conversation.topic]?.serializedData().base64EncodedString()
          subscribeToTopic(apiURI: apiURI, account: xmtpClient.address, pushToken: pushToken, topic: conversation.topic, hmacKeys: conversationHmacKeys)
          shouldShowNotification = true
        }
        break
      }
    } catch {
      sentryTrackError(error: error, extras: ["message": "NOTIFICATION_SAVE_MESSAGE_ERROR_2", "topic": conversation.topic])
      print("[NotificationExtension] Error fetching messages: \(error)")
    }
    
    // Wait for 4 seconds before the next attempt
    _ = try? await Task.sleep(nanoseconds: UInt64(4 * 1_000_000_000))
    attempts += 1
  }
  
  return (shouldShowNotification, messageId)
}

func handleGroupWelcome(xmtpClient: XMTP.Client, apiURI: String?, pushToken: String?, group: XMTP.Group, welcomeTopic: String, bestAttemptContent: inout UNMutableNotificationContent) async -> (shouldShowNotification: Bool, messageId: String?) {
  var shouldShowNotification = false
  let messageId = "welcome-" + group.topic
  do {
    // group is already synced in getNewGroup method
    let groupName = try group.groupName()
    let spamScore = await computeSpamScoreGroupWelcome(client: xmtpClient, group: group, apiURI: apiURI)
    if spamScore < 0 { // Message is going to main inbox
      shouldShowNotification = true
      bestAttemptContent.title = groupName
      bestAttemptContent.body = "You have been added to a new group"
    } else if spamScore == 0 { // Message is Request
      shouldShowNotification = false
      trackNewRequest()
    } else { // Message is Spam
      shouldShowNotification = false
    }
    
  } catch {
    sentryTrackError(error: error, extras: ["message": "NOTIFICATION_SAVE_MESSAGE_ERROR_3", "topic": group.topic])
    print("[NotificationExtension] Error handling group invites: \(error)")
  }
  
  return (shouldShowNotification, messageId)
}

func handleGroupMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope, apiURI: String?, bestAttemptContent: inout UNMutableNotificationContent) async -> (shouldShowNotification: Bool, messageId: String?, messageIntent: INSendMessageIntent?) {
  var shouldShowNotification = false
  let contentTopic = envelope.contentTopic
  var messageId: String? = nil
  var messageIntent: INSendMessageIntent? = nil
  
  do {
    let groups = try await xmtpClient.conversations.groups()
    if let group = groups.first(where: { $0.topic == contentTopic }) {
      try await group.sync()
      if var decodedMessage = try? await decodeMessage(xmtpClient: xmtpClient, envelope: envelope) {
        
        // For now, use the group member linked address as "senderAddress"
        // @todo => make inboxId a first class citizen
        if let senderAddresses = try group.members.first(where: {$0.inboxId == decodedMessage.senderAddress})?.addresses {
          decodedMessage.senderAddress = senderAddresses[0]
        }

        let decodedMessageResult = handleMessageByContentType(decodedMessage: decodedMessage, xmtpClient: xmtpClient);
        messageId = decodedMessageResult.id
        if decodedMessageResult.senderAddress == xmtpClient.inboxID || decodedMessageResult.senderAddress == xmtpClient.address || decodedMessageResult.forceIgnore {
          
        } else {
          let spamScore = await computeSpamScoreGroupMessage(client: xmtpClient, group: group, decodedMessage: decodedMessage, apiURI: apiURI)
          
          if spamScore < 0 { // Message is going to main inbox
            shouldShowNotification = true
            if let groupName = try? group.groupName() {
              bestAttemptContent.title = groupName
            }
            let profilesState = getProfilesState(account: xmtpClient.address)

            // We replaced decodedMessage.senderAddress from inboxId to actual address
            // so it appears well in the app until inboxId is a first class citizen
            if let senderProfile = profilesState?.profiles?[decodedMessage.senderAddress] {
              bestAttemptContent.subtitle = getPreferredName(address: decodedMessage.senderAddress, socials: senderProfile.socials)
            }

            if let content = decodedMessageResult.content {
              bestAttemptContent.body = content
            }
            
            let groupImage = try? group.groupImageUrlSquare()
            messageIntent = getIncomingGroupMessageIntent(group: group, content: bestAttemptContent.body, senderId: decodedMessage.senderAddress, senderName: bestAttemptContent.subtitle)
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


func handleOngoingConversationMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope, bestAttemptContent: inout UNMutableNotificationContent, body: [String: Any]) async -> (shouldShowNotification: Bool, messageId: String?, messageIntent: INSendMessageIntent?) {
  var shouldShowNotification = false
  let contentTopic = envelope.contentTopic
  var conversationTitle = getSavedConversationTitle(contentTopic: contentTopic)
  var messageId: String? = nil
  var messageIntent: INSendMessageIntent? = nil
  
  let decodedMessage = try? await decodeMessage(xmtpClient: xmtpClient, envelope: envelope)
  // If couldn't decode the message, not showing
  if let message = decodedMessage {
    let decodedMessageResult = handleMessageByContentType(decodedMessage: message, xmtpClient: xmtpClient);
    
    if decodedMessageResult.senderAddress == xmtpClient.address || decodedMessageResult.forceIgnore {
      // Message is from me or a reaction removal, let's drop it
      print("[NotificationExtension] Not showing a notification")
    } else if let content = decodedMessageResult.content {
      bestAttemptContent.body = content
      
      let profilesState = getProfilesState(account: xmtpClient.address)
      var senderAvatar: String? = nil
      if let senderAddress = decodedMessageResult.senderAddress, let senderProfile = profilesState?.profiles?[senderAddress] {
        conversationTitle = getPreferredName(address: senderAddress, socials: senderProfile.socials)
        senderAvatar = getPreferredAvatar(socials: senderProfile.socials)
      }
    
      if conversationTitle.isEmpty, let senderAddress = decodedMessageResult.senderAddress {
        conversationTitle = shortAddress(address: senderAddress)
      }
      bestAttemptContent.title = conversationTitle
      shouldShowNotification = true
      messageId = decodedMessageResult.id
      messageIntent = getIncoming1v1MessageIntent(topic: envelope.contentTopic, senderId: decodedMessage?.senderAddress ?? "", senderName: bestAttemptContent.title, senderAvatar: senderAvatar, content: bestAttemptContent.body)
    }
  } else {
    print("[NotificationExtension] Not showing a notification because could not decode message")
    sentryTrackMessage(message: "Could not decode envelope", extras: ["envelope": envelope, "account": xmtpClient.address])
  }
  if (isDebugAccount(account: xmtpClient.address)) {
    sentryTrackMessage(message: "DEBUG_NOTIFICATION", extras: ["shouldShowNotification": shouldShowNotification, "messageId": messageId ?? "EMPTY", "bestAttemptContentBody": bestAttemptContent.body, "bestAttemptContentTitle": bestAttemptContent.title])
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

func saveMessage(account: String, topic: String, sent: Date, senderAddress: String, content: String, id: String, contentType: String, referencedMessageId: String?) throws {
  if (isDebugAccount(account: account)) {
    sentryAddBreadcrumb(message: "Calling save message with sender \(senderAddress) and content \(content)")
  }
  let savedMessage = SavedNotificationMessage(topic: topic, content: content, senderAddress: senderAddress, sent: Int(sent.timeIntervalSince1970 * 1000), id: id, contentType: contentType, account: account, referencedMessageId: referencedMessageId)
  
  var savedMessagesList = loadSavedMessages()
  savedMessagesList.append(savedMessage)
  let encodedValue = try JSONEncoder().encode(savedMessagesList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  let mmkv = getMmkv()
  mmkv?.set(encodedString!, forKey: "saved-notifications-messages")
  if (isDebugAccount(account: account)) {
    sentryAddBreadcrumb(message: "Done save message - count \(savedMessagesList.count) - value \(encodedString ?? "EMPTY")")
  }
}

func decodeMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) async throws -> DecodedMessage? {
  // If topic is MLS, the conversation should already be there
  // @todo except if it's new convo => call sync before?
  if (isGroupMessageTopic(topic: envelope.contentTopic)) {
    let groupList = try! await xmtpClient.conversations.groups()
    if let group = groupList.first(where: { $0.topic == envelope.contentTopic }) {
      do {
        print("[NotificationExtension] Decoding group message...")
        let envelopeBytes = envelope.message
        let _ = try await group.processMessageDecrypted(envelopeBytes: envelopeBytes)
        let decodedMessage = try await group.processMessage(envelopeBytes: envelopeBytes)
        print("[NotificationExtension] Group message decoded!")
        return decodedMessage
      } catch {
        sentryTrackMessage(message: "NOTIFICATION_DECODING_ERROR", extras: ["error": error, "envelope": envelope])
        print("[NotificationExtension] ERROR WHILE DECODING \(error)")
        return nil
      }
    } else {
      sentryTrackMessage(message: "NOTIFICATION_GROUP_NOT_FOUND", extras: ["envelope": envelope])
      return nil
    }
  }
  
  // V1/V2 convos 1:1, will be deprecated once 1:1 are migrated to MLS
  
  guard let conversation = await getPersistedConversation(xmtpClient: xmtpClient, contentTopic: envelope.contentTopic) else {
    sentryTrackMessage(message: "NOTIFICATION_CONVERSATION_NOT_FOUND", extras: ["envelope": envelope])
    return nil
  }
  
  do {
    print("[NotificationExtension] Decoding message...")
    let decodedMessage = try conversation.decode(envelope)
    print("[NotificationExtension] Message decoded!")
    return decodedMessage
  } catch {
    sentryTrackError(error: error, extras: ["message": "NOTIFICATION_DECODING_ERROR", "envelope": envelope])
    return nil
  }
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
      if (isGroupMessageTopic(topic: decodedMessage.topic) && referencedMessageId != nil) {
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
      return (nil, decodedMessage.senderAddress, false, nil)
    }
    
    if (isDebugAccount(account: xmtpClient.address)) {
      sentryAddBreadcrumb(message: "Finished handling message content - \(contentToReturn ?? "EMPTY") - tosave \(contentToSave ?? "EMPTY")")
    }
    
    // If there's content to save, save it
    if let content = contentToSave {
      try saveMessage(
        account: xmtpClient.address,
        topic: decodedMessage.topic,
        sent: decodedMessage.sent,
        senderAddress: decodedMessage.senderAddress,
        content: content,
        id: decodedMessage.id,
        contentType: contentType,
        referencedMessageId: referencedMessageId
      )
    }
    return (contentToReturn, decodedMessage.senderAddress, forceIgnore, decodedMessage.id)
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
    return message.decodeOrNull()?.senderAddress == xmtpClient.inboxID
  } else {
    return false
  }
}
