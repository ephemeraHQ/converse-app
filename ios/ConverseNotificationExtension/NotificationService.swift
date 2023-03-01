//
//  NotificationService.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/12/2022.
//

import UserNotifications
import KeychainAccess
import XMTP
import CryptoKit
import Alamofire

struct SavedNotificationMessage: Codable {
  var topic: String
  var content: String
  var senderAddress: String
  var sent: Int
  var id: String
}

func getKeychainValue(forKey: String) -> String? {
  let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
  let appBundleId = extensionBundleID.replacingOccurrences(of: ".ConverseNotificationExtension", with: "")
  let keychain = Keychain(service: appBundleId)
  let value = keychain[forKey]
  return value
}

func unsetKeychainValue(forKey: String) throws {
  let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
  let appBundleId = extensionBundleID.replacingOccurrences(of: ".ConverseNotificationExtension", with: "")
  let keychain = Keychain(service: appBundleId)
  try keychain.remove(forKey)
}

func setKeychainValue(value: String, forKey: String) throws {
  let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
  let appBundleId = extensionBundleID.replacingOccurrences(of: ".ConverseNotificationExtension", with: "")
  let keychain = Keychain(service: appBundleId)
  try keychain.set(value, key: forKey)
}

func getXmtpClientFromKeys() -> XMTP.Client? {
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
    let client = try Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv)))
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

func saveMessage(topic: String, sent: Date, senderAddress: String, content: String, id: String) throws {
  let sharedDefaults = SharedDefaults()
  let savedMessage = SavedNotificationMessage(topic: topic, content: content, senderAddress: senderAddress, sent: Int(sent.timeIntervalSince1970 * 1000), id: id)
  
  var savedMessagesList = loadSavedMessages()
  savedMessagesList.append(savedMessage)
  let encodedValue = try JSONEncoder().encode(savedMessagesList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  sharedDefaults.set(encodedString, forKey: "saved-notifications-messages")
}

func getSavedConversationTitle(contentTopic: String)-> String {
  let sharedDefaults = SharedDefaults()
  let conversationDictString = sharedDefaults.string(forKey: "conversation-\(contentTopic)")
  if let data = conversationDictString?.data(using: .utf8) {
    if let conversationDict = try! JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] {
      let shortAddress = conversationDict["shortAddress"]
      let lensHandle = conversationDict["lensHandle"]
      let ensName = conversationDict["ensName"]
      return "\(lensHandle ?? (ensName ?? (shortAddress ?? "")))"
    }
  }
  return "";
}

func getPersistedConversation(xmtpClient: XMTP.Client, contentTopic: String) -> Conversation? {
  let hashedKey = CryptoKit.SHA256.hash(data: contentTopic.data(using: .utf8)!)
  let hashString = hashedKey.compactMap { String(format: "%02x", $0) }.joined()
  var persistedConversation = getKeychainValue(forKey: "XMTP_CONVERSATION_\(hashString)")
  if (persistedConversation == nil) {
    persistedConversation = getKeychainValue(forKey: "XMTP_CONVERSATION_TEMP_\(hashString)")
  }
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
    try setKeychainValue(value: jsonString, forKey: "XMTP_CONVERSATION_TEMP_\(hashString)")
  } catch {
    print("[NotificationExtension] Could not persist the new conversation to keychain")
  }
}

func decodeConversationMessage(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) async -> (content: String?, fromMe: Bool) {
  let conversation = getPersistedConversation(xmtpClient: xmtpClient, contentTopic: envelope.contentTopic);
  if (conversation != nil) {
    do {
      print("[NotificationExtension] Decoding message...")
      let decodedMessage = try conversation!.decode(envelope)
      let decodedContent: String? = try decodedMessage.content()
      print("[NotificationExtension] Message decoded!")
      if (decodedContent != nil) {
        // Let's save the notification for immediate display
        try saveMessage(topic: envelope.contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: decodedContent!, id: decodedMessage.id)
      }
      return (decodedContent, decodedMessage.senderAddress == xmtpClient.address)
    } catch {
      return (nil, false);
      //      return "ERROR WHILE DECODING \(error)";
    }
  } else {
    return (nil, false);
    //    return "NO CONVERSATION";
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

func handleNewConversation(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) {
  do {
    // Let's subscribe to that specific topic
    let sharedDefaults = SharedDefaults()
    let apiURI = sharedDefaults.string(forKey: "api-uri")?.replacingOccurrences(of: "\"", with: "")
    let loggedAddress = sharedDefaults.string(forKey: "xmtp-address")
    let expoPushToken = getKeychainValue(forKey: "EXPO_PUSH_TOKEN")
    
    if (isIntroTopic(topic: envelope.contentTopic)) {
      let conversation = try xmtpClient.conversations.fromIntro(envelope: envelope)
      switch conversation {
      case let .v1(conversationV1): do {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions.insert(.withFractionalSeconds)
        let createdAt = formatter.string(from: conversation.createdAt)
        
        let conversationDict = ["version": "v2", "peerAddress": conversationV1.peerAddress, "createdAt": createdAt]
        var addresses = [conversationV1.peerAddress, loggedAddress!]
        addresses.sort()
        let conversationV1Topic = "/xmtp/0/dm-\(addresses[0])-\(addresses[1])/proto"
        subscribeToTopic(apiURI: apiURI, expoPushToken: expoPushToken, topic: conversationV1Topic)
        persistDecodedConversation(contentTopic: conversationV1Topic, dict: conversationDict)
      }
      default: do {}
      }
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
      }
      default: do {}
      }
    }
  } catch {
    print("[NotificationExtension] Could not decode new conversation envelope \(error)")
  }
}

func handleNotificationAsync(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  
  if let bestAttemptContent = bestAttemptContent {
    
    print("[NotificationExtension] Received a notification")
    
    if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String, let encodedMessage = body["message"] as? String {
      
      let xmtpClient = getXmtpClientFromKeys();
      
      if (xmtpClient != nil) {
        
        let encryptedMessageData = Data(base64Encoded: Data(encodedMessage.utf8))!
        let envelope = XMTP.Envelope.with { envelope in
          envelope.message = encryptedMessageData
          envelope.contentTopic = contentTopic
        }
        
        if (isIntroTopic(topic: contentTopic) || isInviteTopic(topic: contentTopic)) {
          handleNewConversation(xmtpClient: xmtpClient!, envelope: envelope)
        } else {
          let conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
          bestAttemptContent.title = conversationTitle;
          let decodedMessageResult = await decodeConversationMessage(xmtpClient: xmtpClient!, envelope: envelope)
          if (decodedMessageResult.fromMe) {
            // Message is from me, let's ignore it
            contentHandler(UNNotificationContent())
            return
          } else if (decodedMessageResult.content != nil) {
            bestAttemptContent.body = decodedMessageResult.content!;
          }
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
