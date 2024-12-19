//
//  Spam.swift
//  ConverseNotificationExtension
//
//  Created by Alex Risch on 6/25/24.
//

import Foundation
import XMTP
import Alamofire

func getSenderSpamScore(address: String, apiURI: String?) async -> Double {
  var senderSpamScore: Double = 0.0
  if (apiURI != nil && !apiURI!.isEmpty) {
    let senderSpamScoreURI = "\(apiURI ?? "")/api/spam/senders/batch"
    do {
      let response = try await withUnsafeThrowingContinuation { continuation in
        AF.request(senderSpamScoreURI, method: .post, parameters: ["sendersAddresses": [address]], encoding: JSONEncoding.default, headers: nil).validate().responseData { response in
          if let data = response.data {
            continuation.resume(returning: data)
            return
          }
          if let err = response.error {
            continuation.resume(throwing: err)
            return
          }
          fatalError("should not get here")
        }
      }
      
      if let json = try JSONSerialization.jsonObject(with: response, options: []) as? [String: Any] {
        if let score = json[address] as? Double {
          senderSpamScore = score
        }
      }
    } catch {
      print(error)
    }
  }
  return senderSpamScore
}

func computeSpamScoreConversation(address: String, message: String?, contentType: String, apiURI: String?) async -> Double {
  let spamScore: Double = await getSenderSpamScore(address: address, apiURI: apiURI)
  let messageSpamScore = getMessageSpamScore(message: message, contentType: contentType)
  return spamScore + messageSpamScore
}

func getMessageSpamScore(message: String?, contentType: String) -> Double {
  var spamScore: Double = 0
  if contentType.starts(with: "xmtp.org/text:") {
    if let unwrappedMessage = message {
      if containsURL(input: unwrappedMessage) {
        spamScore += 1
      }
      
      if containsRestrictedWords(in: unwrappedMessage) {
        spamScore += 1
      }
    }
  }
  return spamScore
}

let restrictedWords = [
  "Coinbase",
  "Airdrop",
  "voucher",
  "offer",
  "restriction",
  "Congrats",
  
  "$SHIB",
  "$AERO"
]

func containsRestrictedWords(in searchString: String) -> Bool {
  // Convert the search string to lowercase
  let lowercasedSearchString = searchString.lowercased()
  
  // Check each restricted word in the lowercase search string
  for word in restrictedWords {
    if lowercasedSearchString.contains(word.lowercased()) {
      return true
    }
  }
  return false
}

func computeSpamScoreV3Welcome(client: XMTP.Client, conversation: XMTP.Conversation, apiURI: String?) async -> Double {
  do {
//    try await client.preferences.syncConsent()
//    // Probably an unlikely case until consent proofs for groups exist
//    do {
//      let convoState = try await client.preferences.conversationState(conversationId: conversation.id)
//      let convoAllowed = convoState == .allowed
//      if convoAllowed {
//        return -1
//      }
//    } catch {
//      
//    }

    if case .group(let group) = conversation {
      let inviterInboxId = try group.addedByInboxId()
      let inviterState = try await client.preferences.inboxIdState(inboxId: inviterInboxId)

      let inviterAllowed = inviterState == .allowed
      if inviterAllowed {
        return -1
      }
      let inviterDenied = inviterState == .denied
      if inviterDenied {
        return 1
      }
      let members = try await conversation.members()
      var anyDenied = false
      var anyAllowed = false
      if let inviterAddresses = members.first(where: {$0.inboxId == inviterInboxId})?.addresses {

        for address in inviterAddresses {
          let addressState = try await client.preferences.addressState(address: address)
          if addressState == .denied {
            anyDenied = true
          }
          if addressState == .allowed {
            anyAllowed = true
          }
        }
        if anyDenied {
          return 1
        }

        if anyAllowed {
          return -1
        }

        if let firstAddress = inviterAddresses.first {
          let senderSpamScore = await getSenderSpamScore(address: firstAddress, apiURI: apiURI)
            return senderSpamScore
        }
      }
    } else if case .dm(let dm) = conversation {
        print("It's a DM with details: \(dm)")
      
    }
  } catch {
    sentryTrackError(error: error, extras: ["message": "Failed to compute Spam Score for V3 Welcome"])
    return 0
  }

  return 0
}

func computeSpamScoreV3Message(client: XMTP.Client, conversation: XMTP.Conversation, decodedMessage: DecodedMessage, apiURI: String?) async -> Double {
  do {
    
//    try await client.preferences.syncConsent()
    let groupDenied = try await client.preferences.conversationState(conversationId: conversation.id) == .denied
    if groupDenied {
      // Network consent will override other checks
      return 1
    }
    let senderInboxId = decodedMessage.senderInboxId
    let senderDenied = try await client.preferences.inboxIdState(inboxId: senderInboxId) == .denied
    if senderDenied {
      // Network consent will override other checks
      return 1
    }
    
    let senderAllowed = try await client.preferences.inboxIdState(inboxId: senderInboxId) == .allowed
    if senderAllowed {
      // Network consent will override other checks
      return -1
    }
    
    
    let convoAllowed = try await client.preferences.conversationState(conversationId: conversation.id) == .allowed
    if convoAllowed {
      // Network consent will override other checks
      return -1
    }
    
    if case .group(let group) = conversation {

      if let senderAddresses = try await group.members.first(where: {$0.inboxId == senderInboxId})?.addresses {
        for address in senderAddresses {
          if try await client.preferences.addressState(address: address) == .denied {
            return 1
          }
        }
        for address in senderAddresses {
          if try await client.preferences.addressState(address: address) == .allowed {
            return -1
          }
        }
      }
    } else if case .dm(let dm) = conversation {
      let peer = try dm.peerInboxId
      
      if try await client.preferences.inboxIdState(inboxId: peer) == .allowed {
        return -1
      }
      if try await client.preferences.inboxIdState(inboxId: peer) == .denied {
        return 1
      }
    }
  } catch {
    //
    sentryTrackError(error: error, extras: ["message": "Failed to compute Spam Score for V3 Message"])
  }
  let contentType = getContentTypeString(type: decodedMessage.encodedContent.type)
  
  let messageContent = String(data: decodedMessage.encodedContent.content, encoding: .utf8)
  let messageSpamScore = getMessageSpamScore(message: messageContent, contentType: contentType)
  
  return messageSpamScore
}
