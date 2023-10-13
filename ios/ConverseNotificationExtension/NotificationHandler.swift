//
//  NotificationHandler.swift
//  ConverseNotificationExtension
//
//  Created by lourou on 2023-10-13.
//

import Foundation
import MMKVAppExtension

let maxStoredIds = 10
let key = "notificationIds"
let mmkv = MMKV.default()

func incrementBadge(for content: UNMutableNotificationContent) {
  let newBadgeCount = getBadge() + 1
  setBadge(newBadgeCount)
  content.badge = NSNumber(value: newBadgeCount)
}

func shouldShowNotification(for messageId: String?) -> Bool {
  // Check if the messageId is not nil and not an empty string
  guard let id = messageId, !id.isEmpty else {
    return false
  }
  
  // If the id already exists in the list, don't show the notification
  let existingIds = retrieveExistingIds()
  if existingIds.contains(id) {
    return false
  }

  // Append the new id to the list
  var updatedIds = existingIds
  updatedIds.append(id)

  // If the list exceeds the maximum limit, trim from the beginning
  if updatedIds.count > maxStoredIds {
    updatedIds.removeFirst(updatedIds.count - maxStoredIds)
  }

  // Store the updated list of IDs back to storage
  if let jsonData = try? JSONEncoder().encode(updatedIds) {
    mmkv?.set(jsonData, forKey: key)
  }
  
  // If all conditions are met, show the notification
  return true
}

func retrieveExistingIds() -> [String] {
  if let jsonData = mmkv?.data(forKey: key),
   let ids = try? JSONDecoder().decode([String].self, from: jsonData) {
    return ids
  }
  return []
}
