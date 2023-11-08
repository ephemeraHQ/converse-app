//
//  Datatypes.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation

struct SavedNotificationMessage: Codable {
  var topic: String
  var content: String
  var senderAddress: String
  var sent: Int
  var id: String
  var sentViaConverse: Bool
  var contentType: String
  var account: String
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
  var account: String
  var spamScore: Double? {
    didSet {
      if let value = spamScore {
        // Whenever spamScore is set, round it to two decimal to ensure it fits as a 2-digit float in the database
        spamScore = (value * 100).rounded() / 100
      }
    }
  }
}

struct Accounts: Codable {
  var currentAccount: String
  var accounts: [String]
  var databaseId: Dictionary<String, String>?
}

struct AccountsStore: Codable {
  var state: Accounts;
  var version: Int
}
