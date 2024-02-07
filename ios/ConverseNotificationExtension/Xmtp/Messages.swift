//
//  Messages.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP

func handleNewConversationFirstMessage(xmtpClient: XMTP.Client, apiURI: String?, pushToken: String?, conversation: XMTP.Conversation, bestAttemptContent: inout UNMutableNotificationContent) async -> (shouldShowNotification: Bool, messageId: String?) {
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
        
        let spamScore = computeSpamScore(
          address: conversation.peerAddress,
          message: messageContent,
          sentViaConverse: message.sentViaConverse,
          contentType: contentType
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
          let decodedMessageResult = handleMessageByContentType(decodedMessage: message, xmtpClient: xmtpClient, sentViaConverse: message.sentViaConverse);
          
          if decodedMessageResult.senderAddress == xmtpClient.address || decodedMessageResult.forceIgnore {
            // Message is from me or a reaction removal, let's drop it
            print("[NotificationExtension] Not showing a notification")
            break
          } else if let content = decodedMessageResult.content {
            bestAttemptContent.title = shortAddress(address: conversation.peerAddress)
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
          subscribeToTopic(apiURI: apiURI, account: xmtpClient.address, pushToken: pushToken, topic: conversation.topic)
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

func handleOngoingConversationMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope, bestAttemptContent: inout UNMutableNotificationContent, body: [String: Any]) async -> (shouldShowNotification: Bool, messageId: String?) {
  var shouldShowNotification = false
  let contentTopic = envelope.contentTopic
  var conversationTitle = getSavedConversationTitle(contentTopic: contentTopic)
  let sentViaConverse = body["sentViaConverse"] as? Bool ?? false
  
  var messageId: String? = nil
  
  let decodedMessage = try? await decodeMessage(xmtpClient: xmtpClient, envelope: envelope)
  // If couldn't decode the message, not showing
  if let message = decodedMessage {
    let decodedMessageResult = handleMessageByContentType(decodedMessage: message, xmtpClient: xmtpClient, sentViaConverse: sentViaConverse);
    
    if decodedMessageResult.senderAddress == xmtpClient.address || decodedMessageResult.forceIgnore {
      // Message is from me or a reaction removal, let's drop it
      print("[NotificationExtension] Not showing a notification")
    } else if let content = decodedMessageResult.content {
      bestAttemptContent.body = content
      if conversationTitle.isEmpty, let senderAddress = decodedMessageResult.senderAddress {
        conversationTitle = shortAddress(address: senderAddress)
      }
      bestAttemptContent.title = conversationTitle
      shouldShowNotification = true
      messageId = decodedMessageResult.id
    }
  } else {
    print("[NotificationExtension] Not showing a notification because could not decode message")
    sentryTrackMessage(message: "Could not decode envelope", extras: ["envelope": envelope, "account": xmtpClient.address])
  }
  
  return (shouldShowNotification, messageId)
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

func saveMessage(account: String, topic: String, sent: Date, senderAddress: String, content: String, id: String, sentViaConverse: Bool, contentType: String) throws {
  let savedMessage = SavedNotificationMessage(topic: topic, content: content, senderAddress: senderAddress, sent: Int(sent.timeIntervalSince1970 * 1000), id: id, sentViaConverse: sentViaConverse, contentType: contentType, account: account)
  
  var savedMessagesList = loadSavedMessages()
  savedMessagesList.append(savedMessage)
  let encodedValue = try JSONEncoder().encode(savedMessagesList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  let mmkv = getMmkv()
  mmkv?.set(encodedString!, forKey: "saved-notifications-messages")
}

func decodeMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) async throws -> DecodedMessage? {
  guard let conversation = await getPersistedConversation(xmtpClient: xmtpClient, contentTopic: envelope.contentTopic) else {
    print("[NotificationExtension] NOTIFICATION_CONVERSATION_NOT_FOUND", envelope)
    sentryTrackMessage(message: "NOTIFICATION_CONVERSATION_NOT_FOUND", extras: ["envelope": envelope])
    return nil
  }

  do {
    print("[NotificationExtension] Decoding message...")
    let decodedMessage = try conversation.decode(envelope)
    print("[NotificationExtension] Message decoded!")
    return decodedMessage
  } catch {
    sentryTrackMessage(message: "NOTIFICATION_DECODING_ERROR", extras: ["error": error, "envelope": envelope])
    print("[NotificationExtension] ERROR WHILE DECODING \(error)")
    return nil
  }
}

func handleMessageByContentType(decodedMessage: DecodedMessage, xmtpClient: XMTP.Client, sentViaConverse: Bool) -> (content: String?, senderAddress: String?, forceIgnore: Bool, id: String?) {
  let contentType = getContentTypeString(type: decodedMessage.encodedContent.type)
  var contentToReturn: String?
  var contentToSave: String?
  var forceIgnore = false
  
  do {
    switch contentType {
    
    case let type where type.starts(with: "xmtp.org/text:"):
      contentToSave = try? decodedMessage.content()
      contentToReturn = contentToSave
      
    
    case let type where type.starts(with: "xmtp.org/remoteStaticAttachment:"):
      let remoteAttachment: RemoteAttachment = try decodedMessage.encodedContent.decoded(with: xmtpClient)
      contentToSave = getJsonRemoteAttachment(remoteAttachment: remoteAttachment)
      contentToReturn = "📎 Media"
      
    case let type where type.starts(with: "xmtp.org/transactionReference:") ||
      type.starts(with: "coinbase.com/coinbase-messaging-payment-activity:"):
      contentToSave = try? decodedMessage.content()
      contentToReturn = "💸 Transaction"
    
    case let type where type.starts(with: "xmtp.org/reaction:"):
      let reaction: Reaction? = try decodedMessage.content()
      let action = reaction?.action.rawValue
      let schema = reaction?.schema.rawValue
      let content = reaction?.content
      
      if action == "removed" {
        forceIgnore = true
      } else if action != "removed" && schema == "unicode", let reactionContent = content {
        contentToReturn = "Reacted \(reactionContent) to a message"
      } else {
        contentToReturn = "Reacted to a message"
      }
      if let validReaction = reaction {
        contentToSave = getJsonReaction(reaction: validReaction)
      } else {
        contentToSave = nil
      }
    
    default:
      sentryTrackMessage(message: "NOTIFICATION_UNKNOWN_CONTENT_TYPE", extras: ["contentType": contentType, "topic": decodedMessage.topic])
      print("[NotificationExtension] UNKOWN CONTENT TYPE: \(contentType)")
      return (nil, decodedMessage.senderAddress, false, nil)
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
        sentViaConverse: sentViaConverse,
        contentType: contentType
      )
    }
    return (contentToReturn, decodedMessage.senderAddress, forceIgnore, decodedMessage.id)
  } catch {
    let errorType = contentType.split(separator: "/").last ?? "UNKNOWN"
    sentryTrackMessage(message: "NOTIFICATION_\(errorType)_ERROR", extras: ["error": error, "topic": decodedMessage.topic])
    print("[NotificationExtension] ERROR WHILE HANDLING \(contentType) \(error)")
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

func computeSpamScore(address: String, message: String?, sentViaConverse: Bool, contentType: String) -> Double {
  var spamScore: Double = 0.0
  if contentType.starts(with: "xmtp.org/text:"), let unwrappedMessage = message, containsURL(input: unwrappedMessage) {
    spamScore += 1
  }
  if sentViaConverse {
    spamScore -= 1
  }
  return spamScore
}
