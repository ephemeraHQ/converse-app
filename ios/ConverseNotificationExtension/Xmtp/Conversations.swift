//
//  Conversations.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import XMTP
import CryptoKit

func getNewConversation(xmtpClient: XMTP.Client, contentTopic: String) async -> XMTP.Conversation? {
  do {
    if (isV3WelcomeTopic(topic: contentTopic)) {
      // Weclome envelopes are too large to send in a push, so a bit of a hack to get the latest group
      try await xmtpClient.conversations.sync()
      let conversation = try await xmtpClient.conversations.list().last
          try await conversation?.sync()
        return conversation
    }
  } catch {
    sentryTrackError(error: error, extras: ["message": "Could not sync new group"])
  }
  return nil
}

func getV3IdFromTopic(topic: String) -> String {
    return topic.replacingOccurrences(of: "/xmtp/mls/1/g-", with: "").replacingOccurrences(of: "/proto", with: "")
}

func getGroup(xmtpClient: Client, groupId: String) async -> Group? {
    do {
      try await xmtpClient.conversations.sync()
      let foundGroup = try xmtpClient.findGroup(groupId: groupId)
      if let group = foundGroup {
        try await group.sync()
        return group
      }

    } catch {
      sentryTrackError(error: error, extras: ["message": "Could not get or sync group"])
    }
  return nil
}
