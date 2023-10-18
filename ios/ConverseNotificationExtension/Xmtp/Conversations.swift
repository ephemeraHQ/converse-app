//
//  Conversations.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import CryptoKit


func handleNewConversation(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) async -> XMTP.Conversation? {
  do {
    if (isInviteTopic(topic: envelope.contentTopic)) {
      let conversation = try await xmtpClient.conversations.fromInvite(envelope: envelope)
      switch conversation {
      case let .v2(conversationV2): do {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions.insert(.withFractionalSeconds)
        let createdAt = formatter.string(from: conversationV2.createdAt)
        let conversationDict = ["version": "v2", "topic": conversationV2.topic, "peerAddress": conversationV2.peerAddress, "createdAt": createdAt, "context":["conversationId": conversationV2.context.conversationID, "metadata": conversationV2.context.metadata] as [String : Any], "keyMaterial": conversationV2.keyMaterial.base64EncodedString()] as [String : Any]
        persistDecodedConversation(account: xmtpClient.address, conversation: conversation)
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
  let mmkv = getMmkv()
  let savedConversationsString = mmkv?.string(forKey: "saved-notifications-conversations")
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
  let savedConversation = SavedNotificationConversation(topic: topic, peerAddress: peerAddress, createdAt: createdAt, context: context, account: account)
  var savedConversationsList = loadSavedConversations()
  savedConversationsList.append(savedConversation)
  let encodedValue = try JSONEncoder().encode(savedConversationsList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  let mmkv = getMmkv()
  mmkv?.set(encodedString!, forKey: "saved-notifications-conversations")
}

func getSavedConversationTitle(contentTopic: String)-> String {
  let mmkv = getMmkv()
  let conversationDictString = mmkv?.string(forKey: "conversation-\(contentTopic)")
  if let data = conversationDictString?.data(using: .utf8) {
    if let conversationDict = try! JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] {
      let shortAddress = conversationDict["shortAddress"]
      let title = conversationDict["title"]
      return "\(title ?? shortAddress ?? "")"
    }
  }
  return "";
}

func getPersistedConversation(xmtpClient: XMTP.Client, contentTopic: String) async -> XMTP.Conversation? {
  let hashedKey = CryptoKit.SHA256.hash(data: contentTopic.data(using: .utf8)!)
  let hashString = hashedKey.compactMap { String(format: "%02x", $0) }.joined()
  let persistedTopicData = getKeychainValue(forKey: "XMTP_TOPIC_DATA_\(xmtpClient.address)_\(hashString)")
  if (persistedTopicData != nil && persistedTopicData!.count > 0) {
    do {
      print("[NotificationExtension] Found a persisted topic data")
      let data = try Xmtp_KeystoreApi_V1_TopicMap.TopicData(
        serializedData: Data(base64Encoded: Data(persistedTopicData!.utf8))!
      )
      let conversation = await xmtpClient.conversations.importTopicData(data: data)
      return conversation
    } catch {
      sentryTrackMessage(message: "Could not import topic data in XMTP Client", extras: ["error": error])
      return nil
    }
  }
  // TODO => remove here as it's the old way of saving convos and we don't use it anymore
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

func persistDecodedConversation(account: String, conversation: Conversation) {
  let hashedKey = CryptoKit.SHA256.hash(data: conversation.topic.data(using: .utf8)!)
  let hashString = hashedKey.compactMap { String(format: "%02x", $0) }.joined()
  do {
    let conversationTopicData = try conversation.toTopicData().serializedData().base64EncodedString()
    try setKeychainValue(value: conversationTopicData, forKey: "XMTP_TOPIC_DATA_\(account)_\(hashString)")
    print("[NotificationExtension] Persisted the new conversation to keychain: XMTP_TOPIC_DATA_\(account)_\(hashString)")
  } catch {
    sentryTrackMessage(message: "Could not persist the new conversation to keychain", extras: ["error": error])
    print("[NotificationExtension] Could not persist the new conversation to keychain")
  }
}
