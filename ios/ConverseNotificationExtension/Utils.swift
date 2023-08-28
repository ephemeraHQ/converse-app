//
//  Utils.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation

func getInfoPlistValue(key: String, defaultValue: String?) throws -> String {
  var value:String? = defaultValue
  if let infoDictionary = Bundle.main.infoDictionary {
      if let plistValue = infoDictionary[key] as? String {
        value = plistValue
      }
  }
  if (value == nil) {
    sentryTrackMessage(message: "NOTIFICATION_MISSING_PLIST_VALUE", extras: ["key": key])
    throw "MISSING_PLIST_VALUE: \(key)"
  }
  return value!
}
