//
//  XmtpClient.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import Alamofire
import CryptoKit

func getXmtpKeyForAccount(account: String) throws -> String? {
  let legacyKey = getKeychainValue(forKey: "XMTP_KEYS")
  if (legacyKey != nil && legacyKey!.count > 0) {
    // We have a legacy key, not yet migrated!
    // Legacy key is in format "[byte, byte, byte...]"
    let decoder = JSONDecoder()
    let decoded = try decoder.decode([UInt8].self, from: legacyKey!.data(using: .utf8)!)
    let data = Data(decoded)
    return data.base64EncodedString()
  }
  let accountKey = getKeychainValue(forKey: "XMTP_KEY_\(account)")
  if (accountKey == nil || accountKey!.count == 0) {
    return nil
  }
  // New keys are in base64 format
  return accountKey!
}

func getDbEncryptionKey() throws -> Data {
  if let key = getKeychainValue(forKey: "LIBXMTP_DB_ENCRYPTION_KEY") {
        if let keyData = Data(base64Encoded: key) {
            return keyData
        } else {
          throw "Unable to decode base64 key"
        }
    } else {
      throw "No db encryption key found"
    }
}


func getXmtpClient(account: String) async -> XMTP.Client? {
  do {
    let xmtpKey = try getXmtpKeyForAccount(account: account)
    if xmtpKey == nil {
      return nil;
    }
    let xmtpKeyData = Data(base64Encoded: xmtpKey!)
    if (xmtpKeyData == nil) {
      return nil;
    }
    let encryptionKey = try! getDbEncryptionKey()
    let privateKeyBundle = try! PrivateKeyBundle(serializedData: xmtpKeyData!)
    let xmtpEnv = getXmtpEnv()
    
    let groupId = "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))"
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupId)?.path)!
    let client = try await Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv), enableV3: true, encryptionKey: encryptionKey, dbDirectory: groupDir))
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

func isGroupWelcomeTopic(topic: String) -> Bool {
  return topic.starts(with: "/xmtp/mls/1/w-")
}

func subscribeToTopic(apiURI: String?, account: String, pushToken: String?, topic: String, hmacKeys: String?) {
  if (apiURI != nil && pushToken != nil && !apiURI!.isEmpty && !pushToken!.isEmpty) {
    let appendTopicURI = "\(apiURI ?? "")/api/subscribe/append"
    AF.request(appendTopicURI, method: .post, parameters: ["topic": topic, "account": account, "nativeToken": pushToken!, "hmacKeys": hmacKeys as Any], encoding: JSONEncoding.default, headers: nil).response { response in
      debugPrint("Response: \(response)")
    }
  }
}

func putGroupInviteRequest(apiURI: String?, account: String, xmtpClient: Client, status: String, joinRequestId: String) async {
  if let apiURI = apiURI, !apiURI.isEmpty {
    do {
      let joinRequestUri = "\(apiURI)/api/groupJoinRequest/\(joinRequestId)"
      let privateKey = try PrivateKey(xmtpClient.keys.identityKey)
      if privateKey.address.lowercased() == account.lowercased() {
        print("here1111")
      } else {
        print("here1123123123", privateKey.address, account, xmtpClient.address, xmtpClient.keys.hasIdentityKey)
      }
      // Use raw data for signing
      let message = "XMTP_IDENTITY"
      guard let messageToSign = message.data(using: .utf8) else {
          fatalError("Failed to encode string to UTF-8 data")
      }

      // Step 2: Sign the UTF-8 encoded data directly using the private key
      let signature = try await privateKey.sign(messageToSign)

      // Step 3: Convert the signature object to a raw byte array
      let sig = try signature.serializedData().base64EncodedString()

      // Step 4: Encode the raw signature bytes to a Base64 string

      let headers: HTTPHeaders = [
          "xmtp-api-signature": sig,
          "xmtp-api-address": privateKey.address
      ]

      let body: [String: Any] = [
          "status": status
      ]
      print(sig)
      AF.request(joinRequestUri, method: .put, parameters: body, encoding: JSONEncoding.default, headers: headers).response { response in
          switch response.result {
          case .success(let data):
              if let data = data, let jsonString = String(data: data, encoding: .utf8) {
                  print("Response Data9: \(jsonString)")
              } else {
                  print("No data received or data could not be converted to string")
              }
          case .failure(let error):
            print("Request failed with error: \(error.localizedDescription)")
            sentryTrackError(error: error, extras: ["message": "UPDATE_GROUP_JOIN_REQUEST_FAILED"])
          }
      }
    } catch {
      sentryTrackError(error: error, extras: ["message": "UPDATE_GROUP_JOIN_REQUEST_FAILED"])
    }
  }
}
