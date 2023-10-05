//
//  SQLite.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import SQLite
extension String: Error {}

// Not used anymore for now, was used to find which account should
// handle a notification but now the payload includes the account.
// Better because handling SQLite in multiple threads might be tricky!

private var openedDbs: [String: Connection] = [:]

func getDbName(account: String) -> String {
  let accounts = getAccountsState()
  let databaseId = accounts?.databaseId[account] ?? account
  let dbName = "converse-\(databaseId).sqlite"
  return dbName
}

func getDb(account: String) throws -> Connection {
  let dbName = getDbName(account: account)
  if let database = openedDbs[dbName] {
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

    openedDbs[dbName] = db
    return db
  } catch {
    print (error)
    throw "Could not connect to db"
  }
}

func hasTopic(account: String, topic: String) throws -> Bool {
  let conversations = Table("conversation")
  let topicColumn = Expression<String>("topic")
  let db = try getDb(account: account)
  let count = try db.scalar(conversations.filter(topicColumn == topic).count)
  return count > 0
}
