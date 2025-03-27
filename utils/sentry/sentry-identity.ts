import * as Sentry from "@sentry/react-native"
import { QueryObserver } from "@tanstack/react-query"
import { useEffect } from "react"
import { useCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getCurrentUserQueryData,
  getCurrentUserQueryOptions,
} from "@/features/current-user/curent-user.query"
import { getProfileQueryConfig, getProfileQueryData } from "@/features/profiles/profiles.query"
import { sentryLogger } from "@/utils/logger"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

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

export function sentryIdentifyUser(args: { userId?: string; username?: string }) {
  sentryLogger.debug("Identifying user", {
    userId: args.userId,
    username: args.username,
  })

  Sentry.setUser({
    ...(args.userId && { id: args.userId }),
    ...(args.username && { username: args.username }),
  })
}
