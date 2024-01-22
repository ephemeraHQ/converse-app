//
//  Keychain.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation


// Code taken from Expo SecureStore to match the way it saves data

func getKeychainQuery(key: String, requireAuthentication: Bool? = nil) -> [String : Any] {
  var service = try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil)
  if let requireAuthentication {
    service.append(":\(requireAuthentication ? "auth" : "no-auth")")
  }
  let encodedKey = Data(key.utf8)
  let query = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: service,
    kSecAttrGeneric as String: encodedKey,
    kSecAttrAccount as String: encodedKey,
  ] as [String : Any]
  return query
}

func _getKeychainValue(forKey: String, requireAuthentication: Bool? = nil) -> String? {
  var query = getKeychainQuery(key: forKey, requireAuthentication: requireAuthentication)
  query[kSecMatchLimit as String] = kSecMatchLimitOne
  query[kSecReturnData as String] = kCFBooleanTrue
  var item: CFTypeRef?
  let status = SecItemCopyMatching(query as CFDictionary, &item)
  switch status {
  case errSecSuccess:
    guard let item = item as? Data else {
      return nil
    }
    return String(data: item, encoding: .utf8)
  default:
    return nil
  }
}

func getKeychainValue(forKey: String) -> String? {
  if let unauthenticatedItem = _getKeychainValue(forKey: forKey, requireAuthentication: false) {
    return unauthenticatedItem
  }
  if let authenticatedItem = _getKeychainValue(forKey: forKey, requireAuthentication: true) {
    return authenticatedItem
  }
  if let legacyItem = _getKeychainValue(forKey: forKey) {
    return legacyItem
  }
  return nil
}

func setKeychainValue(value: String, forKey: String) throws -> Bool {
  var query = getKeychainQuery(key: forKey, requireAuthentication: false)
  let valueData = value.data(using: .utf8)
  query[kSecValueData as String] = valueData
  let accessibility = kSecAttrAccessibleAfterFirstUnlock
  query[kSecAttrAccessible as String] = accessibility
  let status = SecItemAdd(query as CFDictionary, nil)
  switch status {
    case errSecSuccess:
      return true
    case errSecDuplicateItem:
    return try updateKeychainValue(value: value, forKey: forKey)
    default:
      return false
    }
}

func updateKeychainValue(value: String, forKey: String) throws -> Bool {
  let query = getKeychainQuery(key: forKey, requireAuthentication: false)
  let valueData = value.data(using: .utf8)
  let updateDictionary = [kSecValueData as String: valueData]
  let status = SecItemUpdate(query as CFDictionary, updateDictionary as CFDictionary)

  if status == errSecSuccess {
    return true
  } else {
    return false
  }
}
