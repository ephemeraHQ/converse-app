//
//  Conversations.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import CryptoKit


func handleNewConversation(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) -> XMTP.Conversation? {
  do {
    // Let's subscribe to that specific topic
    let sharedDefaults = try! SharedDefaults()
    let apiURI = sharedDefaults.string(forKey: "api-uri")?.replacingOccurrences(of: "\"", with: "")
    let expoPushToken = getKeychainValue(forKey: "EXPO_PUSH_TOKEN")
    
    if (isInviteTopic(topic: envelope.contentTopic)) {
      let conversation = try xmtpClient.conversations.fromInvite(envelope: envelope)
      switch conversation {
      case let .v2(conversationV2): do {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions.insert(.withFractionalSeconds)
        let createdAt = formatter.string(from: conversationV2.createdAt)
        
        let conversationDict = ["version": "v2", "topic": conversationV2.topic, "peerAddress": conversationV2.peerAddress, "createdAt": createdAt, "context":["conversationId": conversationV2.context.conversationID, "metadata": conversationV2.context.metadata] as [String : Any], "keyMaterial": conversationV2.keyMaterial.base64EncodedString()] as [String : Any]
        if (!hasForbiddenPattern(address: conversationV2.peerAddress)) {
          subscribeToTopic(apiURI: apiURI, expoPushToken: expoPushToken, topic: conversationV2.topic)
        }
        persistDecodedConversation(contentTopic: conversationV2.topic, dict: conversationDict)
        try saveConversation(account: xmtpClient.address, topic: conversationV2.topic, peerAddress: conversationV2.peerAddress, createdAt: Int(conversationV2.createdAt.timeIntervalSince1970 * 1000), context: ConversationContext(conversationId: conversationV2.context.conversationID, metadata: conversationV2.context.metadata))
      }
      default: do {}
      }
      return conversation
    }
  } catch {
    sentryTrackMessage(message: "Could not decode new conversation envelope", extras: ["error": error])
    print("[NotificationExtension] Could not decode new conversation envelope \(error)")
  }
  return nil;
}


func loadSavedConversations() -> [SavedNotificationConversation] {
  let sharedDefaults = try! SharedDefaults()
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


func saveConversation(account: String, topic: String, peerAddress: String, createdAt: Int, context: ConversationContext?) throws {
  
  let sharedDefaults = try! SharedDefaults()
  let savedConversation = SavedNotificationConversation(topic: topic, peerAddress: peerAddress, createdAt: createdAt, context: context, account: account)
  var savedConversationsList = loadSavedConversations()
  savedConversationsList.append(savedConversation)
  let encodedValue = try JSONEncoder().encode(savedConversationsList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  sharedDefaults.set(encodedString, forKey: "saved-notifications-conversations")
  
  // Now also save in SQLite
  // TODO => stop saving in SharedDefaults or just the id since it's already in sqlite!
  do {
    try insertConversation(account: account, topic: topic, peerAddress: peerAddress, createdAt: createdAt, context: context)
  } catch {
    print("COULD NOT INSERT CONVO IN SQLITE: \(error)")
  }
  
}

func getSavedConversationTitle(contentTopic: String)-> String {
  let sharedDefaults = try! SharedDefaults()
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
  let persistedConversation = getKeychainValue(forKey: "XMTP_CONVERSATION_\(hashString)")
  if (persistedConversation != nil && persistedConversation!.count > 0) {
    do {
      print("[NotificationExtension] Found a persisted conversation")
      let conversation = try xmtpClient.importConversation(from: persistedConversation!.data(using: .utf8)!)
      return conversation
    } catch {
      sentryTrackMessage(message: "Could not import conversation in XMTP Client", extras: ["error": error])
      return nil
    }
  }
  sentryTrackMessage(message: "No keychain value found for topic", extras: ["contentTopic": contentTopic])
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
    sentryTrackMessage(message: "Could not persist the new conversation to keychain", extras: ["error": error])
    print("[NotificationExtension] Could not persist the new conversation to keychain")
  }
}
