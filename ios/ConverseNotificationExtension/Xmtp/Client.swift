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
    let client = try await Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv)))
    client.register(codec: AttachmentCodec())
    client.register(codec: RemoteAttachmentCodec())
    client.register(codec: ReactionCodec())
    client.register(codec: ReplyCodec())
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

func subscribeToTopic(apiURI: String?, account: String, pushToken: String?, topic: String) {
  if (apiURI != nil && pushToken != nil && !apiURI!.isEmpty && !pushToken!.isEmpty) {
    let appendTopicURI = "\(apiURI ?? "")/api/subscribe/append"
    AF.request(appendTopicURI, method: .post, parameters: ["topic": topic, "account": account, "nativeToken": pushToken!], encoding: JSONEncoding.default, headers: nil).response { response in
      debugPrint("Response: \(response)")
    }
  }
}
