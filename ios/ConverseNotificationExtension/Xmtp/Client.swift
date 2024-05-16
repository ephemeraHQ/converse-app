//
//  XmtpClient.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import Alamofire

func getXmtpKeyForAccount(account: String) throws -> Data? {
  let legacyKey = getKeychainValue(forKey: "XMTP_KEYS")
  if (legacyKey != nil && legacyKey!.count > 0) {
    // We have a legacy key, not yet migrated!
    // Legacy key is in format "[byte, byte, byte...]"
    let decoder = JSONDecoder()
    let decoded = try decoder.decode([UInt8].self, from: legacyKey!.data(using: .utf8)!)
    let data = Data(decoded)
    return data
  }
  let accountKey = getKeychainValue(forKey: "XMTP_KEY_\(account)")
  if (accountKey == nil || accountKey!.count == 0) {
    return nil
  }
  // New keys are in base64 format
  return Data(base64Encoded: accountKey!)
}

func getXmtpClient(account: String) async -> XMTP.Client? {
  do {
    let xmtpKeyData = try getXmtpKeyForAccount(account: account)
    if (xmtpKeyData == nil) {
      return nil;
    }
    let privateKeyBundle = try! PrivateKeyBundle(serializedData: xmtpKeyData!)
    let xmtpEnv = getXmtpEnv()
    
    let groupId = "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))"
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupId)?.path)!
    let env = try! getInfoPlistValue(key: "Env", defaultValue: "dev")
    let dbFileName = "xmtp-\(env)-\(account).db3"
    let dbPath = (groupDir as NSString).appendingPathComponent(dbFileName)
    // @todo => use the right encryption key
    let client = try await Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv), mlsAlpha: true, mlsEncryptionKey: Data([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20]), mlsDbPath: dbPath))
    client.register(codec: AttachmentCodec())
    client.register(codec: RemoteAttachmentCodec())
    client.register(codec: ReactionCodec())
    client.register(codec: ReplyCodec())
    return client
  } catch {
    sentryTrackError(error: error, extras: ["message": "NOTIFICATION_XMTP_CLIENT_NOT_INSTANTIATED"]);
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

func isGroupMessageTopic(topic: String) -> Bool {
  return topic.starts(with: "/xmtp/mls/1/g-")
}

func subscribeToTopic(apiURI: String?, account: String, pushToken: String?, topic: String, hmacKeys: String?) {
  if (apiURI != nil && pushToken != nil && !apiURI!.isEmpty && !pushToken!.isEmpty) {
    let appendTopicURI = "\(apiURI ?? "")/api/subscribe/append"
    AF.request(appendTopicURI, method: .post, parameters: ["topic": topic, "account": account, "nativeToken": pushToken!, "hmacKeys": hmacKeys as Any], encoding: JSONEncoding.default, headers: nil).response { response in
      debugPrint("Response: \(response)")
    }
  }
}
