//
//  Sentry.swift
//  ConverseNotificationExtension
//
//  Created by Noe Malzieu on 28/08/2023.
//

import Foundation
import Sentry

func initSentry() {
  SentrySDK.start { options in
    options.dsn = "https://fb7c7cbf876644b68a05db08623c8369@o4504757119680512.ingest.sentry.io/4504757120729088"
    options.environment = "dev"
    options.debug = true // Helpful to see what's going on
    
  }
}

func sentryTrackMessage(message: String, extras: [String : Any]?) {
  let scope = Scope()
  scope.setExtras(extras)
  SentrySDK.capture(message: message, scope: scope)
  SentrySDK.flush(timeout: 0.5)
}
