//
//  Conversations.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import CryptoKit

func getNewConversationFromEnvelope(xmtpClient: XMTP.Client, envelope: XMTP.Envelope) async -> XMTP.Conversation? {
  do {
    if (isInviteTopic(topic: envelope.contentTopic)) {
      
      let conversation = try await xmtpClient.conversations.fromInvite(envelope: envelope)
      switch conversation {
      case .v2(_): do {
        persistDecodedConversation(account: xmtpClient.address, conversation: conversation)
      }
      default: do {}
      }
      return conversation
    }
  } catch {
    sentryTrackError(error: error, extras: ["message": "Could not decode new conversation envelope"])
  }
  return nil
}

func getNewGroup(xmtpClient: XMTP.Client, contentTopic: String) async -> XMTP.Group? {
  do {
    if (isGroupWelcomeTopic(topic: contentTopic)) {
      // Weclome envelopes are too large to send in a push, so a bit of a hack to get the latest group
      try await xmtpClient.conversations.sync()
      let groups = try await xmtpClient.conversations.groups()
      if let group = groups.max(by: { $0.createdAt < $1.createdAt }) {
        try await group.sync()
        return group
      }
    }
  } catch {
    sentryTrackError(error: error, extras: ["message": "Could not sync new group"])
  }
  return nil
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

func saveConversation(account: String, topic: String, peerAddress: String, createdAt: Int, context: ConversationContext?, spamScore: Double?) throws {
  var savedConversation = SavedNotificationConversation(topic: topic, peerAddress: peerAddress, createdAt: createdAt, context: context, account: account, spamScore: spamScore)
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
  let secureMmkv = getSecureMmkvForAccount(account: xmtpClient.address)
  if let mmkv = secureMmkv {
    let jsonData = mmkv.data(forKey: "XMTP_TOPICS_DATA")
    do {
      if let data = jsonData, let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: String], let topicData = json[contentTopic] {
        do {
          print("[NotificationExtension] Found a persisted topic data")
          let data = try Xmtp_KeystoreApi_V1_TopicMap.TopicData(
            serializedData: Data(base64Encoded: topicData)!
          )
          let conversation = await xmtpClient.conversations.importTopicData(data: data)
          return conversation
        } catch {
          sentryTrackError(error: error, extras: ["message": "Could not import topic data in XMTP Client"])
          return nil
        }
      }
    } catch {
      sentryTrackError(error: error, extras: ["message": "Error while getting persisted topics"])
    }
  }
  
  // TODO => remove this a bit later
  // During migration time, data is still in keychain, not in mmkv
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
      sentryTrackError(error: error, extras: ["message": "Could not import topic data in XMTP Client"])
    }
  }
  return nil;
}

func persistDecodedConversation(account: String, conversation: Conversation) {
  let secureMmkv = getSecureMmkvForAccount(account: account)
  if let mmkv = secureMmkv {
    let jsonData = mmkv.data(forKey: "XMTP_TOPICS_DATA")
    do {
      if let data = jsonData, var json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: String] {
        do {
          print("[NotificationExtension] Found existing topics data")
          let conversationTopicData = try conversation.toTopicData().serializedData().base64EncodedString()
          json[conversation.topic] = conversationTopicData
          
          let newJsonData = try JSONSerialization.data(withJSONObject: json, options: [])
          mmkv.set(newJsonData, forKey: "XMTP_TOPICS_DATA")
        } catch {
          sentryTrackError(error: error, extras: ["message": "Could not save new topic data in MMKV"])
        }
      }
    } catch {
      sentryTrackError(error: error, extras: ["message": "Error while getting persisted topics"])
    }
  }
}

func getGroupIdFromTopic(topic: String) -> String {
    return topic.replacingOccurrences(of: "/xmtp/mls/1/g-", with: "").replacingOccurrences(of: "/proto", with: "")
}

func getGroup(xmtpClient: Client, groupId: String) async -> Group? {
    do {
      try await xmtpClient.conversations.sync()
       let groups = try await xmtpClient.conversations.groups()
      if let group = groups.first(where: { $0.id == groupId }) {
        try await group.sync()
        return group
      }

    } catch {
      sentryTrackError(error: error, extras: ["message": "Could not get or sync group"])
    }
  return nil
}
