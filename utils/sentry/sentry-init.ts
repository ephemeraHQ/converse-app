import * as Sentry from "@sentry/react-native"
import type { ErrorEvent, EventHint } from "@sentry/types"
import * as Updates from "expo-updates"
import { config } from "@/config"
import { getEnv, isDev } from "@/utils/getEnv"

export function sentryInit() {
  Sentry.init({
    dsn: config.sentry.dsn,
    debug: false,
    enabled: !__DEV__,
    environment: getEnv(),

    // For now let's get all traces
    tracesSampleRate: 1.0,

    // Add more context to your events
    attachStacktrace: true,

    // Add experimental features if needed
    _experiments: {
      profilesSampleRate: isDev ? 1.0 : 0.1,
      replaysSessionSampleRate: isDev ? 1.0 : 0.1,
      replaysOnErrorSampleRate: 1.0,
    },

    beforeSend: (event: ErrorEvent, hint: EventHint) => {
      event.tags = {
        ...event.tags,
        "expo-update-id": Updates.updateId,
        "expo-is-embedded-update": Updates.isEmbeddedLaunch,
      }

      return event
    },
  })
}
