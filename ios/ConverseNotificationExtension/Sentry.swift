//
//  Sentry.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import Sentry

var sentryInitialized = false

func initSentry() {
  DispatchQueue.main.async {
    if (sentryInitialized) {
      return
    }
    let sentryEnv = try! getInfoPlistValue(key: "Env", defaultValue: "dev")

    SentrySDK.start { options in
      options.dsn = "https://fb7c7cbf876644b68a05db08623c8369@o4504757119680512.ingest.sentry.io/4504757120729088"
      options.environment = sentryEnv
      options.debug = false
    }
    sentryInitialized = true
  }
}

func sentryTrackMessage(message: String, extras: [String : Any]?) {
 SentrySDK.capture(message: message) { scope in
   var extrasWithMessage:[String: Any] = ["where": "NOTIFICATION_EXTENSION_IOS"]
   if (extras != nil) {
     for (key, value) in extras! {
       extrasWithMessage[key] = value
     }
   }
   scope.setExtras(extrasWithMessage)
   print(message);
   print(extrasWithMessage);
 }
 SentrySDK.flush(timeout: 3)
}

func sentryTrackError(error: Error, extras: [String : Any]?) {
  print([error, extras]);
 SentrySDK.capture(error: error) { scope in
   var extrasWithMessage:[String: Any] = [:]
   if (extras != nil) {
     for (key, value) in extras! {
       extrasWithMessage[key] = value
     }
   }
   scope.setExtras(extrasWithMessage)
   print(error);
   print(extrasWithMessage);
 }
 SentrySDK.flush(timeout: 3)
}

func sentryAddBreadcrumb(message: String) {
  print(message)
  let crumb = Breadcrumb()
  crumb.level = SentryLevel.info
  crumb.category = "extension"
  crumb.message = message
  SentrySDK.addBreadcrumb(crumb)
}
