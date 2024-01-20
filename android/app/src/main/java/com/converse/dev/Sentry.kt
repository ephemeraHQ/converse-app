package com.converse.dev

import android.content.Context
import android.util.Log
import io.sentry.Scope
import io.sentry.Sentry
import io.sentry.android.core.SentryAndroid
import io.sentry.android.core.SentryAndroidOptions


fun initSentry(appContext: Context) {
    var environment = "dev";
    if (appContext.packageName == "com.converse.preview") {
        environment = "preview";
    } else if (appContext.packageName == "com.converse.prod") {
        environment = "prod"
    }
    SentryAndroid.init(
        appContext
    ) { options: SentryAndroidOptions ->
        options.environment = environment
    }
}


fun sentryTrackError(e: Throwable, extras: Map<String, Any>?) {
    Log.d("ERROR", e.toString())
    Sentry.withScope { scope ->
        extras?.forEach { (key, value) ->
            scope.setExtra(
                key,
                value.toString()
            )
        }
        Sentry.captureException(e)
    }
}

fun sentryTrackMessage(message: String, extras: Map<String, Any>?) {
    Sentry.withScope { scope ->
        extras?.forEach { (key, value) ->
            scope.setExtra(
                key,
                value.toString()
            )
        }
        Sentry.captureMessage(message)
    }
}