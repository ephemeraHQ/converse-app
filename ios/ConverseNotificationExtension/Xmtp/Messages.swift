//
//  Messages.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP


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
