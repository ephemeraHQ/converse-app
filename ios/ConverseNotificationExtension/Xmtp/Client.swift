//
//  XmtpClient.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import Alamofire

extension String: Error {}

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
    guard let encryptionKey = try? getDbEncryptionKey() else {
      sentryTrackMessage(message: "Db Encryption Key is undefined", extras: [:])
      return nil
    }
    let xmtpEnv = getXmtpEnv()
    
    let groupId = "group.\(try! getInfoPlistValue(key: "AppBundleId", defaultValue: nil))"
    let groupDir = (FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupId)?.path)!
    let client = try await Client.build(address: account, options: .init(api: .init(env: xmtpEnv), dbEncryptionKey: encryptionKey, dbDirectory: groupDir))
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

func isV3MessageTopic(topic: String) -> Bool {
  return topic.starts(with: "/xmtp/mls/1/g-")
}

func isV3WelcomeTopic(topic: String) -> Bool {
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

func putGroupInviteRequest(apiURI: String?, account: String, xmtpClient: Client, status: String, joinRequestId: String) async throws {
  if let apiURI = apiURI, !apiURI.isEmpty {
    do {
      let joinRequestUri = "\(apiURI)/api/groupJoinRequest/\(joinRequestId)"
      let secureMmkv = getSecureMmkvForAccount(account: account)
      guard let mmkv = secureMmkv else {
          throw NSError(domain: "PutGroupInviteRequest", code: 1, userInfo: [NSLocalizedDescriptionKey: "Secure MMKV not found"])
      }
      guard let apiKey = mmkv.string(forKey: "CONVERSE_API_KEY") else {
        throw NSError(domain: "PutGroupInviteRequest", code: 2, userInfo: [NSLocalizedDescriptionKey: "API Key not found"])
      }
      let headers: HTTPHeaders = [
          "xmtp-api-signature": apiKey,
          "xmtp-api-address": account
      ]
      let body: [String: Any] = [
            "status": status,
        ]
      
      let response = await AF.request(joinRequestUri, method: .put, parameters: body, encoding: JSONEncoding.default, headers: headers).serializingResponse(using: JSONResponseSerializer()).response
      if let statusCode = response.response?.statusCode, (200...299).contains(statusCode) {
          switch response.result {
          case .success(let value):
              debugPrint("Group Invite Response: \(value)")
          case .failure(let error):
              sentryTrackError(error: error, extras: ["message": "PUT_GROUP_INVITE_REQUEST_FAILED"])
              throw error
          }
      } else {
          let error = NSError(domain: "", code: response.response?.statusCode ?? 0, userInfo: ["message": "Request failed with status code: \(response.response?.statusCode ?? 0)"])
          sentryTrackError(error: error, extras: ["message": "PUT_GROUP_INVITE_REQUEST_FAILED"])
          throw error
      }
    } catch {
      sentryTrackError(error: error, extras: ["message": "PUT_GROUP_INVITE_REQUEST_FAILED"])
      throw error
    }
  } else {
    let error = NSError(domain: "PutGroupInviteRequest", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid API URI"])
    sentryTrackError(error: error, extras: ["message": "PUT_GROUP_INVITE_REQUEST_FAILED"])
    throw error
  }
}
