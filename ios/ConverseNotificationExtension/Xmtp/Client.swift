//
//  XmtpClient.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import Alamofire

func initCodecs() {
  Client.register(codec: AttachmentCodec())
  Client.register(codec: RemoteAttachmentCodec())
  Client.register(codec: ReactionCodec())
}

func getXmtpAccountForTopic(contentTopic: String) -> String? {
  if (isInviteTopic(topic: contentTopic)) {
    // If invite topic, account is part of topic
    let startIndex = contentTopic.index(contentTopic.startIndex, offsetBy: 15)
    let endIndex = contentTopic.index(contentTopic.endIndex, offsetBy: -6)
    return String(contentTopic[startIndex..<endIndex])
  } else {
    let accounts = getAccounts()
    // Probably a conversation topic, let's find it in db
    var account: String? = nil
    var i = 0
    while (account == nil && i < accounts.count) {
      let thisAccount = accounts[i]
      do {
        if (try hasTopic(account: thisAccount, topic: contentTopic)) {
          account = thisAccount
        }
      } catch {
        sentryTrackMessage(message: "Could not check if database has topic", extras: ["error": error])
      }
      
      i += 1
    }
    return account
  }
}

func getXmtpKeyForTopic(contentTopic: String) throws -> Data? {
  let legacyKey = getKeychainValue(forKey: "XMTP_KEYS")
  if (legacyKey != nil && legacyKey!.count > 0) {
    // We have a legacy key, not yet migrated!
    // Legacy key is in format "[byte, byte, byte...]"
    let decoder = JSONDecoder()
    let decoded = try decoder.decode([UInt8].self, from: legacyKey!.data(using: .utf8)!)
    let data = Data(decoded)
    return data
  }
  let account = getXmtpAccountForTopic(contentTopic: contentTopic)
  if (account == nil) {
    return nil
  }
  let accountKey = getKeychainValue(forKey: "XMTP_KEY_\(account!)")
  if (accountKey == nil || accountKey!.count == 0) {
    return nil
  }
  // New keys are in base64 format
  return Data(base64Encoded: accountKey!)
}

func getXmtpClient(contentTopic: String) async -> XMTP.Client? {
  do {
    let xmtpKeyData = try getXmtpKeyForTopic(contentTopic: contentTopic)
    if (xmtpKeyData == nil) {
      sentryTrackMessage(message: "No XMTP key found for topic (might be that user logged out)", extras: nil)
      return nil;
    }
    let privateKeyBundle = try! PrivateKeyBundle(serializedData: xmtpKeyData!)
    let xmtpEnv = getXmtpEnv()
    let client = try await Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv)))
    return client
  } catch {
    sentryTrackMessage(message: "NOTIFICATION_XMTP_CLIENT_NOT_INSTANTIATED", extras: ["error": error])
    return nil;
  }
  
}

func getXmtpEnv() -> XMTP.XMTPEnvironment {
  let env = try! getInfoPlistValue(key: "Env", defaultValue: "dev")
  if (env == "prod") {
    return .production;
  }
  return .dev;
}

func isInviteTopic(topic: String) -> Bool {
  return topic.starts(with: "/xmtp/0/invite-")
}

func isIntroTopic(topic: String) -> Bool {
  return topic.starts(with: "/xmtp/0/intro-")
}

func subscribeToTopic(apiURI: String?, expoPushToken: String?, topic: String) {
  if (apiURI != nil && expoPushToken != nil) {
    let appendTopicURI = "\(apiURI ?? "")/api/subscribe/append"
    AF.request(appendTopicURI, method: .post, parameters: ["topic": topic, "expoToken": expoPushToken!], encoding: JSONEncoding.default, headers: nil).response { response in
      debugPrint("Response: \(response)")
    }
  }
}
