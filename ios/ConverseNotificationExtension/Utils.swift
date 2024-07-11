//
//  Utils.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import Intents
import XMTP

func getInfoPlistValue(key: String, defaultValue: String?) throws -> String {
  var value:String? = defaultValue
  if let infoDictionary = Bundle.main.infoDictionary {
      if let plistValue = infoDictionary[key] as? String {
        value = plistValue
      }
  }
  if (value == nil) {
    sentryTrackMessage(message: "NOTIFICATION_MISSING_PLIST_VALUE", extras: ["key": key])
    throw "MISSING_PLIST_VALUE: \(key)"
  }
  return value!
}

func containsURL(input: String) -> Bool {
  let pattern = "\\b(?:(?:https?|ftp):\\/\\/|www\\.)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?:\\/\\S*)?(?:\\?\\S*)?\\b"
  let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive)
  let matches = regex?.numberOfMatches(in: input, options: [], range: NSRange(location: 0, length: input.utf16.count))
  return matches ?? 0 > 0
}

func shortAddress(address: String) -> String {
  if (address.count > 7) {
    let prefixStart = address.index(address.startIndex, offsetBy: 0)
    let prefixEnd = address.index(address.startIndex, offsetBy: 3)
    let suffixStart = address.index(address.startIndex, offsetBy: address.count - 4)
    let suffixEnd = address.index(address.startIndex, offsetBy: address.count - 1)
    let prefixRange = prefixStart...prefixEnd
    let suffixRange = suffixStart...suffixEnd
    let prefix = address[prefixRange]
    let suffix = address[suffixRange]
    return "\(prefix)...\(suffix)"
  }
  return address
}

func getApiURI() -> String? {
  let mmkv = getMmkv()
  var apiURI = mmkv?.string(forKey: "api-uri")
  // TODO => remove shared defaults
  if (apiURI == nil) {
    let sharedDefaults = try! SharedDefaults()
    apiURI = sharedDefaults.string(forKey: "api-uri")?.replacingOccurrences(of: "\"", with: "")
  }
  return apiURI
}

func isDebugAccount(account: String) -> Bool {
  return ["0xf9a3bb070c1f9b3186a547ded991bed04a289c5b", "0x2376e9c7c604d1827ba9acb1293dc8b4da2f0db3"].contains(account.lowercased())
}

func getPreferredName(address: String, socials: ProfileSocials) -> String {
  if let primaryUsername = socials.userNames?.first(where: { $0.isPrimary ?? false}) {
    return primaryUsername.displayName ?? primaryUsername.name;
  }
  
  if let primaryEns = socials.ensNames?.first(where: { $0.isPrimary ?? false}) {
    return primaryEns.displayName ?? primaryEns.name;
  }
  
  return shortAddress(address: address)
}

func getPreferredAvatar(socials: ProfileSocials) -> String? {
  if let primaryUsername = socials.userNames?.first(where: { $0.isPrimary ?? false}) {
    return primaryUsername.avatar;
  }
  
  if let primaryEns = socials.ensNames?.first(where: { $0.isPrimary ?? false}) {
    return primaryEns.avatar;
  }
  return nil
}

func getIncomingGroupMessageIntent(group: Group, content: String, senderId: String, senderName: String?) -> INSendMessageIntent {
  let handle = INPersonHandle(value: senderId, type: .unknown)
  
  let sender = INPerson(personHandle: handle,
                        nameComponents: nil,
                        displayName: senderName,
                        image: nil,
                        contactIdentifier: nil,
                        customIdentifier: nil)
  
  let conversationName = try? group.groupName()
  let intent = INSendMessageIntent(recipients: [sender],
                                   outgoingMessageType: .outgoingMessageText,
                                   content: content,
                                   speakableGroupName: (conversationName != nil) ? INSpeakableString(spokenPhrase: conversationName!) : nil,
                                   conversationIdentifier: group.topic,
                                   serviceName: nil,
                                   sender: sender,
                                   attachments: nil)
  
  if let groupAvatarUrlString = try? group.groupImageUrlSquare(), let groupAvatarUrl = URL(string: groupAvatarUrlString) {
    let avatar = INImage(url: groupAvatarUrl)
    intent.setImage(avatar, forParameterNamed: \.speakableGroupName)
  }
  
  
  return intent
}

func getIncoming1v1MessageIntent(topic: String, senderId: String, senderName: String?, senderAvatar: String?, content: String) -> INSendMessageIntent {
  let handle = INPersonHandle(value: senderId, type: .unknown)
  var avatar: INImage? = nil
  if let avatarUrlString = senderAvatar, let avatarUrl = URL(string: avatarUrlString) {
    avatar = INImage(url: avatarUrl)
  }
  let sender = INPerson(personHandle: handle,
                        nameComponents: nil,
                        displayName: senderName,
                        image: avatar,
                        contactIdentifier: nil,
                        customIdentifier: nil)
  
  let intent = INSendMessageIntent(recipients: nil,
                                   outgoingMessageType: .outgoingMessageText,
                                   content: content,
                                   speakableGroupName: nil,
                                   conversationIdentifier: topic,
                                   serviceName: nil,
                                   sender: sender,
                                   attachments: nil)
  
  return intent
}
