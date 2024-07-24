//
//  NotificationHandler.swift
//  ConverseNotificationExtension
//
//  Created by lourou on 2023-10-13.
//

import Foundation
import MMKVAppExtension

let DAILY_REQUEST_NOTIFICAITON_IDENTIFIER = "DailyRequestNotification"
let DAILY_REQUEST_NOTIFICATION_TIME = 86400

func incrementBadge(for content: UNMutableNotificationContent) {
  let newBadgeCount = getBadge() + 1
  setBadge(newBadgeCount)
  content.badge = NSNumber(value: newBadgeCount)
}

func notificationAlreadyShown(for messageId: String?) -> Bool {
  let maxStoredIds = 10
  
  // Check if the messageId is not nil and not an empty string
  guard let id = messageId, !id.isEmpty else {
    return true
  }
  
  // If the id already exists in the list, don't show the notification
  let existingIds = getShownNotificationIds()
  if existingIds.contains(id) {
    return true
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
  return false
}

func cancelNotification(contentHandler: ((UNNotificationContent) -> Void)) {
  let emptyContent = UNMutableNotificationContent()
  contentHandler(emptyContent)
}

func scheduleNotification(with requestCount: Int32) {
  let content = UNMutableNotificationContent()
  content.title = "You have new requests!"
  content.body = "You received \(requestCount) new request in the last 24 hours."
  content.sound = UNNotificationSound.default
  // Configure the trigger for 24 hours from now
  
  let calendar = Calendar.current
  let now = Date()
  let futureDate = calendar.date(byAdding: .second, value: DAILY_REQUEST_NOTIFICATION_TIME, to: now)!
  let futureDateComponents = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: futureDate)
  
  let trigger = UNCalendarNotificationTrigger(dateMatching: futureDateComponents, repeats: false)
  
  
  let request = UNNotificationRequest(identifier: DAILY_REQUEST_NOTIFICAITON_IDENTIFIER, content: content, trigger: trigger)
  
  let center = UNUserNotificationCenter.current()
  center.add(request) { error in
    if let error = error {
      print("Error: \(error.localizedDescription)")
    }
  }
}

func storeRequestCount(_ count: Int32) {
  let mmkv = getMmkv()
  mmkv?.set(count,forKey: DAILY_REQUEST_NOTIFICAITON_IDENTIFIER)
}

func retrieveRequestCount() -> Int32 {
  let mmkv = getMmkv()
  let requestCount = mmkv?.int32(forKey: DAILY_REQUEST_NOTIFICAITON_IDENTIFIER)
  return requestCount ?? 0
}

func getExistingNotificationTriggerTime(completion: @escaping (DateComponents?) -> Void) {
  let center = UNUserNotificationCenter.current()
  center.getPendingNotificationRequests { requests in
    if let notificationRequest = requests.first(where: { $0.identifier == DAILY_REQUEST_NOTIFICAITON_IDENTIFIER }),
       let trigger = notificationRequest.trigger as? UNCalendarNotificationTrigger {
      completion(trigger.dateComponents)
    } else {
      completion(nil)
    }
  }
}

func trackNewRequest() {
  let center = UNUserNotificationCenter.current()
  
  // Store the updated count
  
  getExistingNotificationTriggerTime { triggerDateComponents in
    if let triggerDateComponents = triggerDateComponents {
      // Retrieve the current count
      var currentCount = retrieveRequestCount()
      
      // Increment the count
      currentCount += 1
      storeRequestCount(currentCount)
      // Cancel the existing notification
      center.removePendingNotificationRequests(withIdentifiers: [DAILY_REQUEST_NOTIFICAITON_IDENTIFIER])
      
      // Schedule a new notification with the updated content for the same time as the original
      let content = UNMutableNotificationContent()
      content.title = "You have new requests!"
      if currentCount == 1 {
        content.body = "You received \(currentCount) new request in the last 24 hours."
      } else {
        content.body = "You received \(currentCount) new requests in the last 24 hours."
      }
      content.sound = UNNotificationSound.default
      
      let trigger = UNCalendarNotificationTrigger(dateMatching: triggerDateComponents, repeats: false)
      let request = UNNotificationRequest(identifier: DAILY_REQUEST_NOTIFICAITON_IDENTIFIER, content: content, trigger: trigger)
      
      center.add(request) { error in
        if let error = error {
          print("Error: \(error.localizedDescription)")
        }
      }
    } else  {
      storeRequestCount(1)
      // Schedule the notification if it hasn't been scheduled yet
      scheduleNotification(with: 1)
    }
  }
}
