//
//  Spam.swift
//  ConverseNotificationExtension
//
//  Created by Alex Risch on 6/25/24.
//

import Foundation
import XMTP
import Alamofire
import web3

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

func computeSpamScoreGroupWelcome(client: XMTP.Client, group: XMTP.Group, apiURI: String?) async -> Double {
  do {
    let consentList = try await client.contacts.refreshConsentList()
    // Probably an unlikely case until consent proofs for groups exist
    let groupAllowed = await client.contacts.isGroupAllowed(groupId: group.id)
    if groupAllowed {
      return -1
    }
    let inviterInboxId = try group.addedByInboxId()
    let inviterAllowed = await client.contacts.isInboxAllowed(inboxId: inviterInboxId)
    if inviterAllowed {
      return -1
    }
    let inviterDenied = await client.contacts.isInboxDenied(inboxId: inviterInboxId)
    if inviterDenied {
      return 1
    }
    let members = try group.members
    if let inviterAddresses = members.first(where: {$0.inboxId == inviterInboxId})?.addresses {
      for address in inviterAddresses {
        if await client.contacts.isDenied(EthereumAddress(address).toChecksumAddress()) {
          return 1
        }
      }
      for address in inviterAddresses {
        if await client.contacts.isAllowed(EthereumAddress(address).toChecksumAddress()) {
          return -1
        }
      }
      if let firstAddress = inviterAddresses.first {
        let senderSpamScore = await getSenderSpamScore(address: EthereumAddress(firstAddress).toChecksumAddress(), apiURI: apiURI)
          return senderSpamScore
      }

    }
  } catch {
    return 0
  }

  return 0
}

func computeSpamScoreGroupMessage(client: XMTP.Client, group: XMTP.Group, decodedMessage: DecodedMessage, apiURI: String?) async -> Double {
  var senderSpamScore: Double = 0
  do {
    
    try await client.contacts.refreshConsentList()
    let groupDenied = await client.contacts.isGroupDenied(groupId: group.id)
    if groupDenied {
      // Network consent will override other checks
      return 1
    }
    let senderInboxId = decodedMessage.senderAddress
    let senderDenied = await client.contacts.isInboxDenied(inboxId: senderInboxId)
    if senderDenied {
      // Network consent will override other checks
      return 1
    }
    
    let senderAllowed = await client.contacts.isInboxAllowed(inboxId: senderInboxId)
    if senderAllowed {
      // Network consent will override other checks
      return -1
    }
    
    
    let groupAllowed = await client.contacts.isGroupAllowed(groupId: group.id)
    if groupAllowed {
      // Network consent will override other checks
      return -1
    }
    
    if let senderAddresses = try group.members.first(where: {$0.inboxId == senderInboxId})?.addresses {
      for address in senderAddresses {
        if await client.contacts.isDenied(EthereumAddress(address).toChecksumAddress()) {
          return 1
        }
      }
      for address in senderAddresses {
        if await client.contacts.isAllowed(EthereumAddress(address).toChecksumAddress()) {
          return 1
        }
      }
    }
    
    // TODO: Handling for inbox Id
    // spamScore = await getSenderSpamScore(address: senderInboxId, apiURI: apiURI)
  } catch {
    //
  }
  let contentType = getContentTypeString(type: decodedMessage.encodedContent.type)
  
  let messageContent = String(data: decodedMessage.encodedContent.content, encoding: .utf8)
  let messageSpamScore = getMessageSpamScore(message: messageContent, contentType: contentType)
  
  return senderSpamScore + messageSpamScore
}
