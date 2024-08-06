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

func getProfilesStore(account: String) -> ProfilesStore? {
  let mmkv = getMmkv()
  let profilesString = mmkv?.string(forKey: "store-\(account)-profiles")
  if (profilesString == nil) {
    return nil
  }
  let decoder = JSONDecoder()
  do {
    let decoded = try decoder.decode(ProfilesStore.self, from: profilesString!.data(using: .utf8)!)
    return decoded
  } catch {
    return nil
  }
}

func saveProfileSocials(account: String, address: String, socials: ProfileSocials) {
  var profilesStore = getProfilesStore(account: account) ?? ProfilesStore(state: Profiles(profiles: [:]), version: 0)
  if profilesStore.state.profiles == nil {
    profilesStore.state.profiles = [:]
  }
  
  let updatedAt = Int(Date().timeIntervalSince1970)
  let newProfile = Profile(updatedAt: updatedAt, socials: socials)
  profilesStore.state.profiles![address] = newProfile
  let mmkv = getMmkv()
  if let jsonData = try? JSONEncoder().encode(profilesStore), let jsonString = String(data: jsonData, encoding: .utf8) {
    mmkv?.set(jsonString, forKey: "store-\(account)-profiles")
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
