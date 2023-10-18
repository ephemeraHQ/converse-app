//
//  NotificationHandler.swift
//  ConverseNotificationExtension
//
//  Created by lourou on 2023-10-13.
//

import Foundation
import MMKVAppExtension

func incrementBadge(for content: UNMutableNotificationContent) {
  let newBadgeCount = getBadge() + 1
  setBadge(newBadgeCount)
  content.badge = NSNumber(value: newBadgeCount)
}

func shouldShowNotification(for messageId: String?) -> Bool {
  let maxStoredIds = 10
  
  // Check if the messageId is not nil and not an empty string
  guard let id = messageId, !id.isEmpty else {
    return false
  }
  
  // If the id already exists in the list, don't show the notification
  let existingIds = getShownNotificationIds()
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
  setShownNotificationIds(updatedIds)
  
  // If all conditions are met, show the notification
  return true
}
