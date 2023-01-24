//
//  Persistence.swift
//
//
//  Created by Pat Nakajima on 1/20/23.
//

import Foundation
import KeychainAccess
import XMTP

struct SavedNotificationMessage: Codable {
    var topic: String
    var content: String
    var sent: Date
  
}


struct Persistence {
  var keychain: Keychain

  init() {
    keychain = Keychain(service: "converse.keychainService")
  }

  func load(conversationTopic: String) throws -> ConversationContainer? {
    guard let data = try keychain.getData(key(topic: conversationTopic)) else {
      return nil
    }

    let decoder = JSONDecoder()
    let decoded = try decoder.decode(ConversationContainer.self, from: data)

    return decoded
  }

  func save(conversation: Conversation) throws {
    keychain[data: key(topic: conversation.topic)] = try JSONEncoder().encode(conversation.encodedContainer)
  }
  
  func loadSavedMessages() throws -> [SavedNotificationMessage] {
    print("loading saved message")
    guard let data = try keychain.getData("saved-notifications-messages") else {
      print("saved messages empty")
      return []
    }
    let decoder = JSONDecoder()
    let decoded = try decoder.decode([SavedNotificationMessage].self, from: data)
    print("returning saved messages")
    return decoded
  }
  
  func saveMessage(topic: String, sent: Date, content: String) throws {
    print("saving message")
    let savedMessage = SavedNotificationMessage(topic: topic, content: content, sent: sent)
  
    var savedMessagesList = try loadSavedMessages()
    print(savedMessagesList)
    print("appending")
    savedMessagesList.append(savedMessage)
    print("saving to keychain")
    keychain[data: "saved-notifications-messages"] = try JSONEncoder().encode(savedMessagesList)
  }

  func key(topic: String) -> String {
    "conversation-\(topic)"
  }
}
