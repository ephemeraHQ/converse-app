//
//  SQLite.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import SQLite
extension String: Error {}

private var db: Connection? = nil;

func getDb(account: String) throws -> Connection {
  if let database = db {
    return database
  }
  do {
    let myGroupID: NSString = "group.com.converse.dev" // TODO => handle preview & prod
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: myGroupID as String)?.path)!
    let dbPath = (groupDir as NSString).appendingPathComponent("converse-\(account).sqlite")
    db = try Connection(dbPath)
    if let database = db {
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
