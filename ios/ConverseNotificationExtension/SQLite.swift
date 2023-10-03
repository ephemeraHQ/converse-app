//
//  SQLite.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import SQLite
extension String: Error {}

private var dbByAccount: [String: Connection] = [:]

func getDbName(account: String) -> String {
  let accounts = getAccountsState()
  let databaseId = accounts?.databaseId[account] ?? account
  return "converse-\(databaseId).sqlite"
}

func getDb(account: String) throws -> Connection {
  if let database = dbByAccount[account] {
    return database
  }
  do {
    let groupId = "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))"
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupId)?.path)!
    let dbPath = (groupDir as NSString).appendingPathComponent(getDbName(account: account))
    let fileURL = URL(fileURLWithPath: dbPath)

    if !FileManager.default.fileExists(atPath: fileURL.path) {
      sentryTrackMessage(message: "DB does not exist", extras: ["account": account, "dbPath": dbPath])
      throw "DB does not exist"
    }
    
    if !FileManager.default.isWritableFile(atPath: fileURL.path) {
      sentryTrackMessage(message: "DB is not writeable", extras: ["account": account, "dbPath": dbPath, "exists": FileManager.default.fileExists(atPath: fileURL.path)])
      throw "DB is not writeable"
    }
    
    let db: Connection = try Connection(dbPath)
    do {
        try db.execute("PRAGMA journal_mode=WAL;")
    } catch {
      sentryTrackMessage(message: "Could not enable WAL mode", extras: ["error": error, "account": account, "dbPath": dbPath, "exists": FileManager.default.fileExists(atPath: fileURL.path)])
      throw "Could not enable WAL mode"
    }

    dbByAccount[account] = db
    return db
  } catch {
    print (error)
    throw "Could not connect to db"
  }
}

func getConversations(account: String) throws {
  let conversations = Table("conversation")
  let topic = Expression<String>("topic")
  let db = try getDb(account: account)
  for conversation in try db.prepare(conversations) {
      print("topic: \(conversation[topic])")
  }
}

func hasTopic(account: String, topic: String) throws -> Bool {
  let conversations = Table("conversation")
  let topicColumn = Expression<String>("topic")
  let db = try getDb(account: account)
  let count = try db.scalar(conversations.filter(topicColumn == topic).count)
  return count > 0
}

func insertConversation(account: String, topic: String, peerAddress: String, createdAt: Int, context: ConversationContext?) throws {
  let conversations = Table("conversation")
  let topicColumn = Expression<String>("topic")
  let peerAddressColumn = Expression<String>("peerAddress")
  let createdAtColumn = Expression<Int>("createdAt")
  let contextConversationIdColumn = Expression<String?>("contextConversationId")
  let contextMetadataColumn = Expression<String?>("contextMetadata")
  let db = try getDb(account: account)
  let insert = conversations.insert(topicColumn <- topic, peerAddressColumn <- peerAddress, createdAtColumn <- createdAt, contextConversationIdColumn <- context?.conversationId, contextMetadataColumn <- context?.metadata != nil ? String(data: try! JSONSerialization.data(withJSONObject: context?.metadata ?? [String: String](), options: []), encoding: .utf8) : nil)
  let rowid = try db.run(insert)
}
