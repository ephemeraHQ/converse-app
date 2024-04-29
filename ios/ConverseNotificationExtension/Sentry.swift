//
//  Sentry.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation

var sentryInitialized = false

func initSentry() {
  DispatchQueue.main.async {
    if (sentryInitialized) {
      return
    }
    let sentryEnv = try! getInfoPlistValue(key: "Env", defaultValue: "dev")

    sentryInitialized = true
  }
}

func sentryTrackMessage(message: String, extras: [String : Any]?) {
 
}

func sentryTrackError(error: Error, extras: [String : Any]?) {
 
}

func sentryAddBreadcrumb(message: String) {
  print(message)
  
}
