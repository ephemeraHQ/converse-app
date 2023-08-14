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

struct SavedNotificationMessage: Codable {
  var topic: String
  var content: String
  var senderAddress: String
  var sent: Int
  var id: String
  var sentViaConverse: Bool
  var contentType: String
}

struct ConversationContext: Codable {
  var conversationId: String
  var metadata: Dictionary<String, String>
}

struct SavedNotificationConversation: Codable {
  var topic: String
  var peerAddress: String
  var createdAt: Int
  var context: ConversationContext?
}

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

// Code taken from Expo SecureStore to match the way it saves data

func getKeychainQuery(key: String) -> [String : Any] {
  let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
  let service = extensionBundleID.replacingOccurrences(of: ".ConverseNotificationExtension", with: "")
  let encodedKey = Data(key.utf8)
  let query = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: service,
    kSecAttrGeneric as String: encodedKey,
    kSecAttrAccount as String: encodedKey
  ] as [String : Any]
  return query
}

func getKeychainValue(forKey: String) -> String? {
  var query = getKeychainQuery(key: forKey)
  query[kSecMatchLimit as String] = kSecMatchLimitOne
  query[kSecReturnData as String] = kCFBooleanTrue
  var item: CFTypeRef?
  let status = SecItemCopyMatching(query as CFDictionary, &item)
  switch status {
  case errSecSuccess:
    guard let item = item as? Data else {
      return nil
    }
    return String(data: item, encoding: .utf8)
  default:
    return nil
  }
}

func setKeychainValue(value: String, forKey: String) throws -> Bool {
  var query = getKeychainQuery(key: forKey)
  let valueData = value.data(using: .utf8)
  query[kSecValueData as String] = valueData
  let accessibility = kSecAttrAccessibleWhenUnlocked
  query[kSecAttrAccessible as String] = accessibility
  let status = SecItemAdd(query as CFDictionary, nil)
  switch status {
    case errSecSuccess:
      return true
    case errSecDuplicateItem:
    return try updateKeychainValue(value: value, forKey: forKey)
    default:
      return false
    }
}

func updateKeychainValue(value: String, forKey: String) throws -> Bool {
  var query = getKeychainQuery(key: forKey)
  let valueData = value.data(using: .utf8)
  let updateDictionary = [kSecValueData as String: valueData]
  let status = SecItemUpdate(query as CFDictionary, updateDictionary as CFDictionary)

  if status == errSecSuccess {
    return true
  } else {
    return false
  }
}


func getXmtpClientFromKeys() async -> XMTP.Client? {
  Client.register(codec: AttachmentCodec())
  Client.register(codec: RemoteAttachmentCodec())
  Client.register(codec: ReactionCodec())
  let xmtpKeys = getKeychainValue(forKey: "XMTP_KEYS")
  if (xmtpKeys == nil || xmtpKeys?.count == 0) {
    return nil;
  }
  do {
    let decoder = JSONDecoder()
    let decoded = try decoder.decode([UInt8].self, from: xmtpKeys!.data(using: .utf8)!)
    let data = Data(decoded)
    let privateKeyBundle = try! PrivateKeyBundle(serializedData: data)
    let xmtpEnv = getXmtpEnv()
    let client = try await Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv)))
    return client
  } catch {
    return nil;
  }
  
}

func getXmtpEnv() -> XMTP.XMTPEnvironment {
  let sharedDefaults = SharedDefaults()
  let xmtpEnvString = sharedDefaults.string(forKey: "xmtp-env")
  if (xmtpEnvString == "\"production\"") {
    return .production;
  } else {
    return .dev;
  }
}

func loadSavedConversations() -> [SavedNotificationConversation] {
  let sharedDefaults = SharedDefaults()
  let savedConversationsString = sharedDefaults.string(forKey: "saved-notifications-conversations")
  if (savedConversationsString == nil) {
    return []
  } else {
    let decoder = JSONDecoder()
    do {
      let decoded = try decoder.decode([SavedNotificationConversation].self, from: savedConversationsString!.data(using: .utf8)!)
      return decoded
    } catch {
      return []
    }
  }
}

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

func saveConversation(topic: String, peerAddress: String, createdAt: Int, context: ConversationContext?) throws {
  let sharedDefaults = SharedDefaults()
  let savedConversation = SavedNotificationConversation(topic: topic, peerAddress: peerAddress, createdAt: createdAt, context: context)
  var savedConversationsList = loadSavedConversations()
  savedConversationsList.append(savedConversation)
  let encodedValue = try JSONEncoder().encode(savedConversationsList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  sharedDefaults.set(encodedString, forKey: "saved-notifications-conversations")
}

func getSavedConversationTitle(contentTopic: String)-> String {
  let sharedDefaults = SharedDefaults()
  let conversationDictString = sharedDefaults.string(forKey: "conversation-\(contentTopic)")
  if let data = conversationDictString?.data(using: .utf8) {
    if let conversationDict = try! JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] {
      let shortAddress = conversationDict["shortAddress"]
      let title = conversationDict["title"]
      // Keeping lensHandle & ensName for now but let's delete them soon
      // and keep only title
      let lensHandle = conversationDict["lensHandle"]
      let ensName = conversationDict["ensName"]
      return "\(title ?? (lensHandle ?? (ensName ?? (shortAddress ?? ""))))"
    }
  }
  return "";
}

func getPersistedConversation(xmtpClient: XMTP.Client, contentTopic: String) -> Conversation? {
  let hashedKey = CryptoKit.SHA256.hash(data: contentTopic.data(using: .utf8)!)
  let hashString = hashedKey.compactMap { String(format: "%02x", $0) }.joined()
  var persistedConversation = getKeychainValue(forKey: "XMTP_CONVERSATION_\(hashString)")
  if (persistedConversation != nil && persistedConversation!.count > 0) {
    do {
      print("[NotificationExtension] Found a persisted conversation")
      let conversation = try xmtpClient.importConversation(from: persistedConversation!.data(using: .utf8)!)
      return conversation
    } catch {
      return nil
    }
  }
  return nil
}

func persistDecodedConversation(contentTopic: String, dict: [String : Any]) {
  let hashedKey = CryptoKit.SHA256.hash(data: contentTopic.data(using: .utf8)!)
  let hashString = hashedKey.compactMap { String(format: "%02x", $0) }.joined()
  do {
    let jsonData = try JSONSerialization.data(withJSONObject: dict, options: [])
    let jsonString = String(data: jsonData, encoding: String.Encoding.utf8)!
    try setKeychainValue(value: jsonString, forKey: "XMTP_CONVERSATION_\(hashString)")
    print("[NotificationExtension] Persisted the new conversation to keychain: XMTP_CONVERSATION_\(hashString)")
  } catch {
    print("[NotificationExtension] Could not persist the new conversation to keychain")
  }
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

func isInviteTopic(topic: String) -> Bool {
  return topic.starts(with: "/xmtp/0/invite-")
}

func isIntroTopic(topic: String) -> Bool {
  return topic.starts(with: "/xmtp/0/intro-")
}

func subscribeToTopic(apiURI: String?, expoPushToken: String?, topic: String) {
  if (apiURI != nil && expoPushToken != nil) {
    let appendTopicURI = "\(apiURI ?? "")/api/subscribe/append"
    AF.request(appendTopicURI, method: .post, parameters: ["topic": topic, "expoToken": expoPushToken!], encoding: JSONEncoding.default, headers: nil).response { response in
      debugPrint("Response: \(response)")
    }
  }
}

func handleNewConversation(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) -> XMTP.Conversation? {
  do {
    // Let's subscribe to that specific topic
    let sharedDefaults = SharedDefaults()
    let apiURI = sharedDefaults.string(forKey: "api-uri")?.replacingOccurrences(of: "\"", with: "")
    let expoPushToken = getKeychainValue(forKey: "EXPO_PUSH_TOKEN")
    
    if (isIntroTopic(topic: envelope.contentTopic)) {
      let conversation = try xmtpClient.conversations.fromIntro(envelope: envelope)
      switch conversation {
      case let .v1(conversationV1): do {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions.insert(.withFractionalSeconds)
        let createdAt = formatter.string(from: conversation.createdAt)
        
        let conversationDict = ["version": "v1", "peerAddress": conversationV1.peerAddress, "createdAt": createdAt]
        var addresses = [conversationV1.peerAddress, xmtpClient.address]
        addresses.sort()
        let conversationV1Topic = "/xmtp/0/dm-\(addresses[0])-\(addresses[1])/proto"
        subscribeToTopic(apiURI: apiURI, expoPushToken: expoPushToken, topic: conversationV1Topic)
        persistDecodedConversation(contentTopic: conversationV1Topic, dict: conversationDict)
        try saveConversation(topic: conversationV1Topic, peerAddress: conversationV1.peerAddress, createdAt: Int(conversation.createdAt.timeIntervalSince1970 * 1000), context: nil)
      }
      default: do {}
      }
      
      return conversation
    } else if (isInviteTopic(topic: envelope.contentTopic)) {
      let conversation = try xmtpClient.conversations.fromInvite(envelope: envelope)
      switch conversation {
      case let .v2(conversationV2): do {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions.insert(.withFractionalSeconds)
        let createdAt = formatter.string(from: conversationV2.createdAt)
        
        let conversationDict = ["version": "v2", "topic": conversationV2.topic, "peerAddress": conversationV2.peerAddress, "createdAt": createdAt, "context":["conversationId": conversationV2.context.conversationID, "metadata": conversationV2.context.metadata], "keyMaterial": conversationV2.keyMaterial.base64EncodedString()] as [String : Any]
        subscribeToTopic(apiURI: apiURI, expoPushToken: expoPushToken, topic: conversationV2.topic)
        persistDecodedConversation(contentTopic: conversationV2.topic, dict: conversationDict)
        try saveConversation(topic: conversationV2.topic, peerAddress: conversationV2.peerAddress, createdAt: Int(conversationV2.createdAt.timeIntervalSince1970 * 1000), context: ConversationContext(conversationId: conversationV2.context.conversationID, metadata: conversationV2.context.metadata))
      }
      default: do {}
      }
      return conversation
    }
  } catch {
    print("[NotificationExtension] Could not decode new conversation envelope \(error)")
  }
  return nil;
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
          if (decodedMessageResult.senderAddress == xmtpClient?.address) {
            // Message is from me, let's ignore it
            print("[NotificationExtension] Dropping a notification coming from me")
            contentHandler(UNNotificationContent())
            return
          } else if (decodedMessageResult.content != nil) {
            bestAttemptContent.body = decodedMessageResult.content!;
            if (conversationTitle.count == 0 && decodedMessageResult.senderAddress != nil) {
              conversationTitle = shortAddress(address: decodedMessageResult.senderAddress!)
            }
          }
          bestAttemptContent.title = conversationTitle;
          //        else {
          //          bestAttemptContent.body = "NO MESSAGE CONTENT";
          //        }
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
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
      //      bestAttemptContent.body = "EXPIRED";
      if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String {
        let conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
        bestAttemptContent.title = conversationTitle;
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
}
