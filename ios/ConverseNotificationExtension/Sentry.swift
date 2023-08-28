//
//  Sentry.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
//import Sentry

func initSentry() {
//  let sentryEnv = try! getInfoPlistValue(key: "Env", defaultValue: "dev")
//
//  SentrySDK.start { options in
//    options.dsn = "https://fb7c7cbf876644b68a05db08623c8369@o4504757119680512.ingest.sentry.io/4504757120729088"
//    options.environment = sentryEnv
//    options.debug = true
//
//  }
}

func sentryTrackMessage(message: String, extras: [String : Any]?) {
//  SentrySDK.capture(message: "NOTIFICATION_EXTENSION_ERROR_IOS") { scope in
//    var extrasWithMessage:[String: Any] = ["message": message]
//    if (extras != nil) {
//      for (key, value) in extras! {
//        extrasWithMessage[key] = value
//      }
//    }
//    scope.setExtras(extrasWithMessage)
//  }
//  SentrySDK.flush(timeout: 3)
}
