import * as Sentry from "@sentry/react-native"
import { useEffect } from "react"
import { useCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getCurrentUserQueryData,
  getCurrentUserQueryOptions,
} from "@/features/current-user/current-user.query"
import { getProfileQueryConfig, getProfileQueryData } from "@/features/profiles/profiles.query"
import { sentryLogger } from "@/utils/logger"
import { isEqual } from "@/utils/objects"
import { createQueryObserverWithPreviousData } from "@/utils/react-query/react-query.helpers"

export function useUpdateSentryUser() {
  const currentSender = useCurrentSender()

  useEffect(() => {
    if (!currentSender) {
      return
    }

    // Track user changes with createQueryObserverWithPreviousData
    const { unsubscribe: unsubscribeFromUserQueryObserver } = createQueryObserverWithPreviousData({
      queryOptions: getCurrentUserQueryOptions({ caller: "useUpdateSentryUser" }),
      observerCallbackFn: (result) => {
        if (isEqual(result.data, result.previousData)) {
          return
        }

        updateSentryIdentity()
      },
    })

    // Track profile changes with createQueryObserverWithPreviousData
    const { unsubscribe: unsubscribeFromProfileQueryObserver } =
      createQueryObserverWithPreviousData({
        queryOptions: getProfileQueryConfig({
          xmtpId: currentSender.inboxId,
          caller: "useUpdateSentryUser",
        }),
        observerCallbackFn: (result) => {
          if (isEqual(result.data, result.previousData)) {
            return
          }

          updateSentryIdentity()
        },
      })

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
        privyUserId: currentProfile?.privyAddress,
      })
    }

    // Initial identity update if data is available
    updateSentryIdentity()

    return () => {
      unsubscribeFromUserQueryObserver()
      unsubscribeFromProfileQueryObserver()
    }
  }, [currentSender])
}

export function sentryIdentifyUser(args: {
  userId?: string
  username?: string
  privyUserId?: string
}) {
  sentryLogger.debug("Identifying user", {
    userId: args.userId,
    username: args.username,
    privyUserId: args.privyUserId,
  })

  Sentry.setUser({
    id: args.userId, // Main user ID
    username: args.username,
    // Add custom attributes
    privyUserId: args.privyUserId, // Custom attribute for Privy user ID
  })
}
