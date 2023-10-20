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
  
  while attempts < 4 { // 4 attempts * 5s = 20s
    let messages = try! await conversation.messages()    
    if !messages.isEmpty {
      let message = messages[0]
      let messageContent = String(data: message.encodedContent.content, encoding: .utf8) ?? "New message"
      let contentType = getContentTypeString(type: message.encodedContent.type)
      let spamScore = computeSpamScore(address: conversation.peerAddress,
                                       message: messageContent,
                                       sentViaConverse: message.sentViaConverse,
                                       contentType: contentType)
      messageId = message.id
      
      do {
        try saveMessage(account: xmtpClient.address,
                        topic: message.topic,
                        sent: message.sent,
                        senderAddress: message.senderAddress,
                        content: messageContent,
                        id: message.id,
                        sentViaConverse: message.sentViaConverse,
                        contentType: contentType)
      } catch {
        sentryTrackMessage(message: "NOTIFICATION_SAVE_MESSAGE_ERROR", extras: ["error": error])
        print("[NotificationExtension] ERROR WHILE SAVING MESSAGE \(error)")
        break
      }
        
      if (contentType.starts(with: "xmtp.org/text:")) {
        bestAttemptContent.title = shortAddress(address: conversation.peerAddress)
        bestAttemptContent.body = messageContent
        if let body = bestAttemptContent.userInfo["body"] as? [String: Any] {
          var updatedBody = body
          updatedBody["topic"] = conversation.topic
          bestAttemptContent.userInfo.updateValue(updatedBody, forKey: "body")
        }
      } else {
        break
      }
      
      if spamScore >= 1 {
        print("[NotificationExtension] Not showing a notification because considered spam")
        break
      } else {
        subscribeToTopic(apiURI: apiURI, account: xmtpClient.address, pushToken: pushToken, topic: conversation.topic)
        shouldShowNotification = true
        break
      }
    }
    
    // Wait for 5 seconds before the next attempt
    _ = try? await Task.sleep(nanoseconds: UInt64(5 * 1_000_000_000)) // 5s in nanoseconds
    attempts += 1
  }
  
  return (shouldShowNotification, messageId)
}

func handleOngoingConversationMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope, bestAttemptContent: inout UNMutableNotificationContent, body: [String: Any]) async -> (shouldShowNotification: Bool, messageId: String?) {
  var shouldShowNotification = false
  let contentTopic = envelope.contentTopic
  var conversationTitle = getSavedConversationTitle(contentTopic: contentTopic)
  let sentViaConverse = body["sentViaConverse"] as? Bool ?? false
  let decodedMessageResult = await decodeConversationMessage(xmtpClient: xmtpClient, envelope: envelope, sentViaConverse: sentViaConverse)
  var messageId: String? = nil
  
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

func decodeConversationMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope, sentViaConverse: Bool) async -> (content: String?, senderAddress: String?, forceIgnore: Bool, id: String?) {
  let conversation = await getPersistedConversation(xmtpClient: xmtpClient, contentTopic: envelope.contentTopic);
  if (conversation != nil) {
    do {
      print("[NotificationExtension] Decoding message...")
      let decodedMessage = try conversation!.decode(envelope)
      print("[NotificationExtension] Message decoded!")
      let contentType = getContentTypeString(type: decodedMessage.encodedContent.type)
      if (contentType.starts(with: "xmtp.org/text:")) {
        let decodedContent: String? = try decodedMessage.content()
        if (decodedContent != nil) {
          // Let's save the notification for immediate display
          try saveMessage(account: xmtpClient.address, topic: envelope.contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: decodedContent!, id: decodedMessage.id, sentViaConverse: sentViaConverse, contentType: contentType)
        }
        return (decodedContent, decodedMessage.senderAddress, false, decodedMessage.id)
      } else if (contentType.starts(with: "xmtp.org/remoteStaticAttachment:")) {
        // Let's save the notification for immediate display
        do {
          let remoteAttachment: RemoteAttachment = try decodedMessage.encodedContent.decoded(with: xmtpClient)
          let contentToSave = getJsonRemoteAttachment(remoteAttachment: remoteAttachment)
          if (contentToSave != nil) {
            try saveMessage(account: xmtpClient.address, topic: envelope.contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: contentToSave!, id: decodedMessage.id, sentViaConverse: sentViaConverse, contentType: contentType)
          }
        } catch {
          sentryTrackMessage(message: "NOTIFICATION_ATTACHMENT_ERROR", extras: ["error": error, "envelope": envelope])
          print("[NotificationExtension] ERROR WHILE SAVING ATTACHMENT CONTENT \(error)")
        }
        return ("📎 Media", decodedMessage.senderAddress, false, decodedMessage.id)
      } else if (contentType.starts(with: "xmtp.org/reaction:")) {
        var notificationContent:String? = "Reacted to a message";
        var ignoreNotification = false;
        let reaction: Reaction? = try decodedMessage.content()
        var action = reaction?.action.rawValue
        var schema = reaction?.schema.rawValue
        var content = reaction?.content
        
        if (action == "removed") {
          ignoreNotification = true;
        }
        
        // Let's save the notification for immediate display
        do {
          if (content != nil) {
            if (action != "removed" && schema == "unicode") {
              notificationContent = "Reacted \(content!) to a message";
            }
            if (reaction != nil) {
              let contentToSave = getJsonReaction(reaction: reaction!);
              if (contentToSave != nil) {
                try saveMessage(account: xmtpClient.address, topic: envelope.contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: contentToSave!, id: decodedMessage.id, sentViaConverse: sentViaConverse, contentType: contentType)
              }
            }
            
          }
          
        } catch {
          sentryTrackMessage(message: "NOTIFICATION_REACTION_ERROR", extras: ["error": error, "envelope": envelope])
          print("[NotificationExtension] ERROR WHILE DECODING REACTION CONTENT \(error)")
        }
        
        return (notificationContent, decodedMessage.senderAddress, ignoreNotification, decodedMessage.id);
      } else {
        print("[NotificationExtension] Unknown content type")
        sentryTrackMessage(message: "NOTIFICATION_UNKNOWN_CONTENT_TYPE", extras: ["contentType": contentType, "envelope": envelope])
        return (nil, decodedMessage.senderAddress, false, nil);
      }
    } catch {
      sentryTrackMessage(message: "NOTIFICATION_DECODING_ERROR", extras: ["error": error, "envelope": envelope])
      print("[NotificationExtension] ERROR WHILE DECODING \(error)")
      return (nil, nil, false, nil);
    }
  } else {
    print("[NotificationExtension] NOTIFICATION_CONVERSATION_NOT_FOUND", envelope)
    sentryTrackMessage(message: "NOTIFICATION_CONVERSATION_NOT_FOUND", extras: ["envelope": envelope])
    return (nil, nil, false, nil);
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

func computeSpamScore(address: String, message: String, sentViaConverse: Bool, contentType: String) -> Double {
  if (address.hasPrefix("0x0000") && address.hasSuffix("0000"))
      || containsURL(input: message)
      || !sentViaConverse {
    return 1
  } else {
    return -1
  }
}
