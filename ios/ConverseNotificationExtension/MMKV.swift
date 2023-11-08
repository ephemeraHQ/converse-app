//
//  MMKV.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import MMKVAppExtension

private var mmkvInstance: MMKV? = nil;

func getMmkv() -> MMKV? {
  if (mmkvInstance == nil) {
    let groupId = "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))"
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupId)?.path)!
    MMKV.initialize(rootDir: nil, groupDir: groupDir, logLevel: MMKVLogLevel.warning)
    mmkvInstance = MMKV(mmapID: "mmkv.default", cryptKey: nil, mode: MMKVMode.multiProcess)
  }
  
  return mmkvInstance;
}

func getAccountsState() -> Accounts? {
  let mmkv = getMmkv()
  let accountsString = mmkv?.string(forKey: "store-accounts")
  if (accountsString == nil) {
    return nil
  }
  let decoder = JSONDecoder()
  do {
    let decoded = try decoder.decode(AccountsStore.self, from: accountsString!.data(using: .utf8)!)
    return decoded.state
  } catch {
    return nil
  }
}

func getCurrentAccount() -> String? {
  var accountsState = getAccountsState()
  if (accountsState == nil || accountsState?.currentAccount == "TEMPORARY_ACCOUNT") {
    return nil
  }
  return accountsState?.currentAccount
}

func getAccounts() -> [String] {
  var accountsState = getAccountsState()
  if (accountsState == nil) {
    return []
  }
  return (accountsState?.accounts.filter({ account in
    return account != "TEMPORARY_ACCOUNT"
  }))!
}

func getBadge() -> Int {
  let mmkv = getMmkv()
  if let badge = mmkv?.int32(forKey: "notifications-badge") {
    return Int(badge)
  }
  return 0
}

func setBadge(_ badge: Int) {
  let mmkv = getMmkv()
  mmkv?.set(Int32(badge), forKey: "notifications-badge")
}

func getShownNotificationIds() -> [String] {
  let mmkv = getMmkv()
  if let jsonData = mmkv?.data(forKey: "notification-ids"),
   let ids = try? JSONDecoder().decode([String].self, from: jsonData) {
    return ids
  }
  return []
}

func setShownNotificationIds(_ ids: [String]) {
  let mmkv = getMmkv()
  if let jsonData = try? JSONEncoder().encode(ids) {
    mmkv?.set(jsonData, forKey: "notification-ids")
  }
}
