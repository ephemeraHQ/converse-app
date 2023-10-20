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

func containsURL(input: String) -> Bool {
  let pattern = "\\b(?:(?:https?|ftp):\\/\\/|www\\.)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?:\\/\\S*)?(?:\\?\\S*)?\\b"
  let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive)
  let matches = regex?.numberOfMatches(in: input, options: [], range: NSRange(location: 0, length: input.utf16.count))
  return matches ?? 0 > 0
}

func shortAddress(address: String) -> String {
  if (address.count > 7) {
    let prefixStart = address.index(address.startIndex, offsetBy: 0)
    let prefixEnd = address.index(address.startIndex, offsetBy: 3)
    let suffixStart = address.index(address.startIndex, offsetBy: address.count - 4)
    let suffixEnd = address.index(address.startIndex, offsetBy: address.count - 1)
    let prefixRange = prefixStart...prefixEnd
    let suffixRange = suffixStart...suffixEnd
    let prefix = address[prefixRange]
    let suffix = address[suffixRange]
    return "\(prefix)...\(suffix)"
  }
  return address
}

func getApiURI() -> String? {
  let mmkv = getMmkv()
  var apiURI = mmkv?.string(forKey: "api-uri")
  // TODO => remove shared defaults
  if (apiURI == nil) {
    let sharedDefaults = try! SharedDefaults()
    apiURI = sharedDefaults.string(forKey: "api-uri")?.replacingOccurrences(of: "\"", with: "")
  }
  return apiURI
}
