import * as Sentry from "@sentry/react-native"
import type { ErrorEvent, EventHint } from "@sentry/types"
import { QueryObserver } from "@tanstack/react-query"
import * as Updates from "expo-updates"
import { useEffect } from "react"
import { useCurrentSender, useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import {
  getCurrentUserQueryData,
  getCurrentUserQueryOptions,
} from "@/features/current-user/curent-user.query"
import { getProfileQueryConfig, getProfileQueryData } from "@/features/profiles/profiles.query"
import { getEnv, isDev } from "@/utils/getEnv"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { config } from "../config"

// Sentry has ~8KB limit for string values
export const MAX_SENTRY_STRING_SIZE = 8000 // bytes

// Error patterns that should not be reported to Sentry
const errorsToFilterOut = [
  "Request failed with status code 401",
  "Request failed with status code 404",
]

export function sentryInit() {
  Sentry.init({
    dsn: config.sentryDSN,
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

type ISentryTrackErrorArgs = {
  error: Error
  tags?: Record<string, string>
  extras?: Record<string, unknown>
}

export function sentryTrackError({ error, extras, tags }: ISentryTrackErrorArgs) {
  // Check if we should filter this error
  const errorMessage = error.message || ""
  const shouldFilter = errorsToFilterOut.some((errorStr) => errorMessage.includes(errorStr))

  if (shouldFilter) {
    // logger.debug(`Filtering out error: ${errorMessage}`)
    return
  }

  Sentry.withScope(async (scope) => {
    if (extras) {
      Object.entries(extras).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }

    if (tags) {
      scope.setTags(tags)
    }

    Sentry.captureException(error)
  })
}

export function sentryIdentifyUser(args: { userId?: string; username?: string }) {
  Sentry.setUser({
    ...(args.userId && { id: args.userId }),
    ...(args.username && { username: args.username }),
  })
}

export function useUpdateSentryUser() {
  const currentSender = useCurrentSender()

  useEffect(() => {
    if (!currentSender) {
      return
    }

    // Track user changes with QueryObserver
    const userQueryObserver = new QueryObserver(
      reactQueryClient,
      getCurrentUserQueryOptions({ caller: "useUpdateSentryUser" }),
    )

    // Track profile changes with QueryObserver
    const profileQueryObserver = new QueryObserver(
      reactQueryClient,
      getProfileQueryConfig({
        xmtpId: currentSender.inboxId,
      }),
    )

    // Function to update Sentry user identity with latest data
    const updateSentryIdentity = () => {
      const currentUser = getCurrentUserQueryData()

      if (!currentUser?.id) {
        return
      }

      const currentProfile = getProfileQueryData({
        xmtpId: currentSender.inboxId,
      })

      sentryIdentifyUser({
        userId: currentUser.id,
        username: currentProfile?.username,
      })
    }

    // Initial identity update if data is available
    updateSentryIdentity()

    // Subscribe to user query changes
    const unsubscribeFromUserQueryObserver = userQueryObserver.subscribe((result) => {
      if (result.data) {
        updateSentryIdentity()
      }
    })

    // Subscribe to profile query changes
    const unsubscribeFromProfileQueryObserver = profileQueryObserver.subscribe((result) => {
      if (result.data) {
        updateSentryIdentity()
      }
    })

    return () => {
      unsubscribeFromUserQueryObserver()
      unsubscribeFromProfileQueryObserver()
    }
  }, [currentSender])
}
