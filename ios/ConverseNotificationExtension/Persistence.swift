//
//  Persistence.swift
//
//
//  Created by Pat Nakajima on 1/20/23.
//

import Foundation
import KeychainAccess
import XMTP



struct Persistence {
  var keychain: Keychain

  init() {
    keychain = Keychain(service: "converse.keychainService")
  }

  func load(conversationTopic: String) throws -> ConversationContainer? {
    let data = try keychain.getData(key(topic: conversationTopic))

    let decoder = JSONDecoder()
    let decoded = try decoder.decode(ConversationContainer.self, from: data!)

    return decoded
  }

  func save(conversation: Conversation) throws {
    keychain[data: key(topic: conversation.topic)] = try JSONEncoder().encode(conversation.encodedContainer)
  }

  func key(topic: String) -> String {
    "conversation-\(topic)"
  }
}
