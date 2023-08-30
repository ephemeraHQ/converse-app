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

func getDb(account: String) throws -> Connection {
  if let database = dbByAccount[account] {
    return database
  }
  do {
    let groupId = "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))"
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupId)?.path)!
    let dbPath = (groupDir as NSString).appendingPathComponent("converse-\(account).sqlite")
    let fileURL = URL(fileURLWithPath: dbPath)

    if !FileManager.default.fileExists(atPath: fileURL.path) {
      throw "DB does not exist"
    }

    dbByAccount[account] = try Connection(dbPath)
    if let database = dbByAccount[account] {
      return database
    }
    throw "Could not connect to db"
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
  print("account \(account) has topic : \(count)")
  return count > 0
}
