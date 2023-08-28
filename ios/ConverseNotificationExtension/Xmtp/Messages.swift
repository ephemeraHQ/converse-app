//
//  Messages.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP


func loadSavedMessages() -> [SavedNotificationMessage] {
  let sharedDefaults = SharedDefaults()
  let savedMessagesString = sharedDefaults.string(forKey: "saved-notifications-messages")
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

func saveMessage(topic: String, sent: Date, senderAddress: String, content: String, id: String, sentViaConverse: Bool, contentType: String) throws {
  let sharedDefaults = SharedDefaults()
  let savedMessage = SavedNotificationMessage(topic: topic, content: content, senderAddress: senderAddress, sent: Int(sent.timeIntervalSince1970 * 1000), id: id, sentViaConverse: sentViaConverse, contentType: contentType)
  
  var savedMessagesList = loadSavedMessages()
  savedMessagesList.append(savedMessage)
  let encodedValue = try JSONEncoder().encode(savedMessagesList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  sharedDefaults.set(encodedString, forKey: "saved-notifications-messages")
}


func decodeConversationMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope, sentViaConverse: Bool) async -> (content: String?, senderAddress: String?, forceIgnore: Bool) {
  let conversation = getPersistedConversation(xmtpClient: xmtpClient, contentTopic: envelope.contentTopic);
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
          try saveMessage(topic: envelope.contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: decodedContent!, id: decodedMessage.id, sentViaConverse: sentViaConverse, contentType: contentType)
        }
        return (decodedContent, decodedMessage.senderAddress, false)
      } else if (contentType.starts(with: "xmtp.org/remoteStaticAttachment:")) {
        // Let's save the notification for immediate display
        do {
          let remoteAttachment: RemoteAttachment = try decodedMessage.encodedContent.decoded()
          let contentToSave = getJsonRemoteAttachment(remoteAttachment: remoteAttachment)
          if (contentToSave != nil) {
            try saveMessage(topic: envelope.contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: contentToSave!, id: decodedMessage.id, sentViaConverse: sentViaConverse, contentType: contentType)
          }
        } catch {
          print("[NotificationExtension] ERROR WHILE SAVING ATTACHMENT CONTENT \(error)")
        }
        return ("📎 Media", decodedMessage.senderAddress, false)
      } else if (contentType.starts(with: "xmtp.org/reaction:")) {
        var notificationContent:String? = "Reacted to a message";
        var ignoreNotification = false;
        let reactionParameters = decodedMessage.encodedContent.parameters;
        let action = reactionParameters["action"] ?? "";
        let schema = reactionParameters["schema"] ?? "";
        
        if (action == "removed") {
          ignoreNotification = true;
        }
        
        // Let's save the notification for immediate display
        do {
          if let reactionContent = String(data: decodedMessage.encodedContent.content, encoding: .utf8) {
            if (action != "removed" && schema == "unicode") {
              notificationContent = "Reacted \(reactionContent) to a message";
            }
            let contentToSave = getJsonReaction(content: reactionContent, parameters: reactionParameters);
            if (contentToSave != nil) {
              try saveMessage(topic: envelope.contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: contentToSave!, id: decodedMessage.id, sentViaConverse: sentViaConverse, contentType: contentType)
            }
            
          }
          
        } catch {
          print("[NotificationExtension] ERROR WHILE SAVING ATTACHMENT CONTENT \(error)")
        }
        
        return (notificationContent, decodedMessage.senderAddress, ignoreNotification);
      } else {
        print("[NotificationExtension] Unknown content type")
        return (nil, decodedMessage.senderAddress, false);
      }
    } catch {
      print("[NotificationExtension] ERROR WHILE DECODING \(error)")
      return (nil, nil, false);
      //      return "ERROR WHILE DECODING \(error)";
    }
  } else {
    return (nil, nil, false);
    //    return "NO CONVERSATION";
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


func getJsonReaction(content: String, parameters: Dictionary<String, String>) -> String? {
  do {
    let reference = parameters["reference"] ?? "";
    let schema = parameters["schema"] ?? "";
    let action = parameters["action"] ?? "";
    let dictionary = NSDictionary(dictionary: ["reference": reference, "action": action, "content": content, "schema": schema])
    let jsonData = try JSONSerialization.data(withJSONObject: dictionary, options: [])
    let jsonString = String(data: jsonData, encoding: .utf8)
    return jsonString
  } catch {
    print("Error converting dictionary to JSON string: \(error.localizedDescription)")
    return nil
  }
}
