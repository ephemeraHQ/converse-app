//
//  Profile.swift
//  Converse
//
//  Created by Noe Malzieu on 05/08/2024.
//

import Foundation
import Alamofire

func getProfile(account: String, address: String) async -> ProfileSocials? {
  var profileFromStore = getProfilesStore(account: account, address: address)
  let formattedAddress =  address.lowercased()
  if let profile = profileFromStore {
    return profile
  }
  
  // If profile is nil, let's refresh it
  try? await refreshProfileFromBackend(account: account, address: formattedAddress)
  
  profileFromStore = getProfilesStore(account: account, address: address)
  if let profile = profileFromStore {
    return profile
  }
  return nil
}

func getInboxIdProfile(account: String, inboxId: String) async -> ProfileSocials? {
  var profileFromStore = getInboxIdProfilesStore(account: account, inboxId: inboxId)
  if let profile = profileFromStore {
    return profile
  }
  
  // If profile is nil, let's refresh it
  try? await refreshInboxProfileFromBackend(account: account, inboxId: inboxId)
  
  profileFromStore = getInboxIdProfilesStore(account: account, inboxId: inboxId)
  if let profile = profileFromStore {
    return profile
  }
  return nil
}

func refreshProfileFromBackend(account: String, address: String) async throws  {
  let apiURI = getApiURI()
  if (apiURI != nil && !apiURI!.isEmpty) {
    let profileURI = "\(apiURI ?? "")/api/profile"
    
    let response = try await withUnsafeThrowingContinuation { continuation in
      AF.request(profileURI, method: .get, parameters: ["address": address]).validate().responseData { response in
        if let data = response.data {
          continuation.resume(returning: data)
          return
        }
        if let err = response.error {
          continuation.resume(throwing: err)
          return
        }
      }
    }
    
    // Create an instance of JSONDecoder
    let decoder = JSONDecoder()
    
    if let socials = try? decoder.decode(ProfileSocials.self, from: response) {
      saveProfileSocials(account: account, address: address, socials: socials)
    }
    
  }
  
}

func refreshInboxProfileFromBackend(account: String, inboxId: String) async throws  {
  let apiURI = getApiURI()
  if (apiURI != nil && !apiURI!.isEmpty) {
    let profileURI = "\(apiURI ?? "")/api/inbox"
    
    let response = try await withUnsafeThrowingContinuation { continuation in
      AF.request(profileURI, method: .get, parameters: ["ids": [inboxId]]).validate().responseData { response in
        if let data = response.data {
          continuation.resume(returning: data)
          return
        }
        if let err = response.error {
          continuation.resume(throwing: err)
          return
        }
      }
    }
    
    // Create an instance of JSONDecoder
    let decoder = JSONDecoder()
    
    if let socials = try? decoder.decode(ProfileSocials.self, from: response) {
      saveInboxIdProfileSocials(account: account, inboxId: inboxId, socials: socials)
    }
    
  }
  
}
