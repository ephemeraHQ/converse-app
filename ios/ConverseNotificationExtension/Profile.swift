//
//  Profile.swift
//  Converse
//
//  Created by Noe Malzieu on 05/08/2024.
//

import Foundation
import Alamofire

func getProfile(address: String) async -> ProfileSocials? {
  let profileFromStore = getProfilesStore(address: address)
  let formattedAddress =  address.lowercased()
  if let profile = profileFromStore {
    return profile
  }
  
  // If profile is nil, let's refresh it
  if let profile = try? await refreshProfileFromBackend(address: formattedAddress) {
    return profile
  }

  return nil
}

func getInboxIdProfile(inboxId: String) async -> ProfileSocials? {
  let profileFromStore = getInboxIdProfilesStore(inboxId: inboxId)
  if let profile = profileFromStore {
    return profile
  }
  
  // If profile is nil, let's refresh it
  if let profile = try? await refreshInboxProfileFromBackend(inboxId: inboxId) {
    return profile[0]
  }
  return nil
}

func refreshProfileFromBackend(address: String) async throws -> ProfileSocials? {
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
      return socials
    }
    return nil
  }
  return nil
}

func refreshInboxProfileFromBackend(inboxId: String) async throws -> [ProfileSocials]? {
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
    
    if let socials = try? decoder.decode([ProfileSocials].self, from: response) {
      return socials
    }
    return nil
  }
  return nil
}
