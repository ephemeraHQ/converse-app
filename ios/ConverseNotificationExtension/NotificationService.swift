//
//  NotificationService.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/12/2022.
//

import UserNotifications
import KeychainAccess
import XMTP
import CryptoKit

struct SavedNotificationMessage: Codable {
    var topic: String
    var content: String
    var senderAddress: String
    var sent: Int
    var id: String
}

func getKeychainValue(forKey: String) -> String? {
  let extensionBundleID = Bundle.main.bundleIdentifier ?? ""
  let appBundleId = extensionBundleID.replacingOccurrences(of: ".ConverseNotificationExtension", with: "")
  let keychain = Keychain(service: appBundleId)
  let value = keychain[forKey]
  return value
}

func getXmtpClientFromKeys() -> XMTP.Client? {
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
    let client = try Client.from(bundle: privateKeyBundle, options: .init(api: .init(env: xmtpEnv)))
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

func loadSavedMessages() -> [SavedNotificationMessage] {
  let sharedDefaults = SharedDefaults()
  let savedMessagesString = sharedDefaults.string(forKey: "saved-notifications-messages")
  if (savedMessagesString == nil) {
    return []
  } else {
    let decoder = JSONDecoder()
    do {
      let decoded = try decoder.decode([SavedNotificationMessage].self, from: savedMessagesString!.data(using: .utf8)!)
      return decoded
    } catch {
      return []
    }
  }
}

func saveMessage(topic: String, sent: Date, senderAddress: String, content: String, id: String) throws {
  let sharedDefaults = SharedDefaults()
  let savedMessage = SavedNotificationMessage(topic: topic, content: content, senderAddress: senderAddress, sent: Int(sent.timeIntervalSince1970 * 1000), id: id)

  var savedMessagesList = loadSavedMessages()
  savedMessagesList.append(savedMessage)
  let encodedValue = try JSONEncoder().encode(savedMessagesList)
  let encodedString = String(data: encodedValue, encoding: .utf8)
  sharedDefaults.set(encodedString, forKey: "saved-notifications-messages")
}

func getSavedConversationTitle(contentTopic: String)-> String {
  let sharedDefaults = SharedDefaults()
  let conversationDictString = sharedDefaults.string(forKey: "conversation-\(contentTopic)")
  if let data = conversationDictString?.data(using: .utf8) {
    if let conversationDict = try! JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] {
      let shortAddress = conversationDict["shortAddress"]
      let lensHandle = conversationDict["lensHandle"]
      let ensName = conversationDict["ensName"]
      return "\(lensHandle ?? (ensName ?? (shortAddress ?? "")))"
    }
  }
  return "";
}

func getPersistedConversation(xmtpClient: XMTP.Client, contentTopic: String) -> Conversation? {
  let hashedKey = CryptoKit.SHA256.hash(data: contentTopic.data(using: .utf8)!)
  let hashString = hashedKey.compactMap { String(format: "%02x", $0) }.joined()
  let persistedConversation = getKeychainValue(forKey: "XMTP_CONVERSATION_\(hashString)")
  if (persistedConversation != nil && persistedConversation!.count > 0) {
    do {
      print("PERSISTED", persistedConversation)
      let conversation = try xmtpClient.importConversation(from: persistedConversation!.data(using: .utf8)!)
      return conversation
    } catch {
      return nil
    }
  }
  return nil
}

func decodeConversationMessage(xmtpClient: XMTP.Client, contentTopic: String, encodedMessage: String) async -> String? {
  let conversation = getPersistedConversation(xmtpClient: xmtpClient, contentTopic: contentTopic);
  if (conversation != nil) {
    print("GOT CONVERSATION", contentTopic, conversation)
    do {
      let encryptedMessageData = Data(base64Encoded: Data(encodedMessage.utf8))!
      let envelope = XMTP.Envelope.with { envelope in
        envelope.message = encryptedMessageData
        envelope.contentTopic = contentTopic
      }
      print("GOTTA DECODE")
      let decodedMessage = try conversation!.decode(envelope)
      print("DECODED")
      let decodedContent: String? = try decodedMessage.content()
      if (decodedContent != nil) {
        // Let's save the notification for immediate display
        try saveMessage(topic: contentTopic, sent: decodedMessage.sent, senderAddress: decodedMessage.senderAddress, content: decodedContent!, id: decodedMessage.id)
      }
      return decodedContent
    } catch {
      return "ERROR WHILE DECODING \(error)";
    }
  } else {
    return "NO CONVERSATION";
  }
}


func handleNotificationAsync(contentHandler: ((UNNotificationContent) -> Void), bestAttemptContent: UNMutableNotificationContent?) async {
  print("Received a notification!")
  
  if let bestAttemptContent = bestAttemptContent {
    
    if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String, let encodedMessage = body["message"] as? String {
      
      let conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
      bestAttemptContent.title = conversationTitle;
      
      let xmtpClient = getXmtpClientFromKeys();

      if (xmtpClient != nil) {
        let messageContent = await decodeConversationMessage(xmtpClient: xmtpClient!, contentTopic: contentTopic, encodedMessage: encodedMessage)
        if (messageContent != nil) {
          bestAttemptContent.body = messageContent!;
        } else {
          bestAttemptContent.body = "NO MESSAGE CONTENT";
        }
      } else {
        bestAttemptContent.body = "NO XMTP CLIENT";
      }
    }
    
    contentHandler(bestAttemptContent)
  }
}

class NotificationService: UNNotificationServiceExtension {
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    Task {
      await handleNotificationAsync(contentHandler: contentHandler, bestAttemptContent: bestAttemptContent);
    }
  }
  
  override func serviceExtensionTimeWillExpire() {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
      bestAttemptContent.body = "EXPIRED";
      if let body = bestAttemptContent.userInfo["body"] as? [String: Any], let contentTopic = body["contentTopic"] as? String {
        let conversationTitle = getSavedConversationTitle(contentTopic: contentTopic);
        bestAttemptContent.title = conversationTitle;
      }
      
      contentHandler(bestAttemptContent)
    }
  }
  
}
