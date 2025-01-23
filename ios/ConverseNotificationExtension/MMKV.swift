//
//  MMKV.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import MMKVAppExtension

private var mmkvInstance: MMKV? = nil;
private var secureMmkvForAccount: [String: MMKV?] = [:];
private var mmkvInitialized = false;

func initializeMmkv() {
  if (!mmkvInitialized) {
    mmkvInitialized = true
    let groupId = "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))"
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupId)?.path)!
    MMKV.initialize(rootDir: nil, groupDir: groupDir, logLevel: MMKVLogLevel.warning)
  }
}

func getMmkv() -> MMKV? {
  if (mmkvInstance == nil) {
    initializeMmkv()
    mmkvInstance = MMKV(mmapID: "mmkv.default", cryptKey: nil, mode: MMKVMode.multiProcess)
  }
  
  return mmkvInstance;
}

func getSecureMmkvForAccount(account: String) -> MMKV? {
  if (secureMmkvForAccount[account] == nil) {
    initializeMmkv()
    let accountEncryptionKey = getKeychainValue(forKey: "CONVERSE_ACCOUNT_ENCRYPTION_KEY_\(account)")
      if let encryptionKey = accountEncryptionKey, let keyData = encryptionKey.prefix(16).data(using: .utf8) {
      secureMmkvForAccount[account] = MMKV(mmapID: "secure-mmkv-\(account)", cryptKey: keyData, mode: MMKVMode.multiProcess)
    }
  }
  return secureMmkvForAccount[account] ?? nil;
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

func getProfilesStore(address: String) -> ProfileSocials? {
  let mmkv = getMmkv()

  let key: String = "tanstack-query-[\"profileSocials\",\"\(address.lowercased())\"]"
  let profilesString = mmkv?.string(forKey: key)
  if (profilesString == nil) {
    return nil
  }
  let decoder = JSONDecoder()
  do {
    let decoded = try decoder.decode(ProfilesQueryCache.self, from: profilesString!.data(using: .utf8)!)
    return decoded.state.data
  } catch {
    return nil
  }
}	

func getInboxIdProfilesStore(inboxId: String) -> ProfileSocials? {
  let mmkv = getMmkv()
  
  let key: String = "tanstack-query-[\"inboxProfileSocials\",\"\(inboxId.lowercased())\"]"
  let profilesString = mmkv?.string(forKey: key)
  if (profilesString == nil) {
    return nil
  }
  let decoder = JSONDecoder()
  do {
    let decoded = try decoder.decode(InboxProfilesQueryCache.self, from: profilesString!.data(using: .utf8)!)
    return decoded.state.data[0]
  } catch {
    return nil
  }
}

func getCurrentAccount() -> String? {
  let accountsState = getAccountsState()
  if (accountsState == nil || accountsState?.currentAccount == "TEMPORARY_ACCOUNT") {
    return nil
  }
  return accountsState?.currentAccount
}

func getAccounts() -> [String] {
  let accountsState = getAccountsState()
  if (accountsState == nil) {
    return []
  }
  return (accountsState?.accounts.filter({ account in
    return account != "TEMPORARY_ACCOUNT"
  }))!
}

func getBadgeStorageKey(account: String) -> String {
  return "notifications-badge-\(account.lowercased())"
}

func getBadgeByAccount(account: String) -> Int {
  let mmkv = getMmkv()
  let key = getBadgeStorageKey(account: account)
  if let accountBadge = mmkv?.double(forKey: key) {
    return Int(accountBadge)
  }
  return 0
}

func setBadgeByAccount(_ badge: Int, account: String) {
  let mmkv = getMmkv()
  let key = getBadgeStorageKey(account: account)
  mmkv?.set(Double(badge), forKey: key)
}

func getAllBadgeCounts() -> Int {
  var count = 0
  let accounts = getAccounts()
  for account in accounts {
    let accountCount = getBadgeByAccount(account: account)
    count += accountCount
  }
  return count
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
