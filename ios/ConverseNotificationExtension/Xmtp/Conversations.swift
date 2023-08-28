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
        
        let conversationDict = ["version": "v2", "topic": conversationV2.topic, "peerAddress": conversationV2.peerAddress, "createdAt": createdAt, "context":["conversationId": conversationV2.context.conversationID, "metadata": conversationV2.context.metadata] as [String : Any], "keyMaterial": conversationV2.keyMaterial.base64EncodedString()] as [String : Any]
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


func saveConversation(topic: String, peerAddress: String, createdAt: Int, context: ConversationContext?) throws {
  let sharedDefaults = try! SharedDefaults()
  let savedConversation = SavedNotificationConversation(topic: topic, peerAddress: peerAddress, createdAt: createdAt, context: context)
  var savedConversationsList = loadSavedConversations()
  savedConversationsList.append(savedConversation)
  let encodedValue = try JSONEncoder().encode(savedConversationsList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  sharedDefaults.set(encodedString, forKey: "saved-notifications-conversations")
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
