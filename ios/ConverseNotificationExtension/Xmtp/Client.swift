//
//  XmtpClient.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import Alamofire


func getXmtpClientFromKeys() async -> XMTP.Client? {
  Client.register(codec: AttachmentCodec())
  Client.register(codec: RemoteAttachmentCodec())
  Client.register(codec: ReactionCodec())
  let xmtpKeys = getKeychainValue(forKey: "XMTP_KEYS")
  if (xmtpKeys == nil || xmtpKeys?.count == 0) {
    return nil;
  }
  do {
    let decoder = JSONDecoder()
    let decoded = try decoder.decode([UInt8].self, from: xmtpKeys!.data(using: .utf8)!)
    let data = Data(decoded)
    let privateKeyBundle = try! PrivateKeyBundle(serializedData: data)
    let xmtpEnv = getXmtpEnv()
    let client = try await Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv)))
    return client
  } catch {
    return nil;
  }
  
}

func getXmtpEnv() -> XMTP.XMTPEnvironment {
  let sharedDefaults = SharedDefaults()
  let xmtpEnvString = sharedDefaults.string(forKey: "xmtp-env")
  if (xmtpEnvString == "\"production\"") {
    return .production;
  } else {
    return .dev;
  }
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
