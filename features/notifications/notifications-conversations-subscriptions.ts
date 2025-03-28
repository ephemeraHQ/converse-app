import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import {
  ensureAllowedConsentConversationsQueryData,
  getAllowedConsentConversationsQueryObserver,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { ensureConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isTempConversation } from "@/features/conversation/utils/is-temp-conversation"
import { getNotificationsPermissionsQueryConfig } from "@/features/notifications/notifications-permissions.query"
import { userHasGrantedNotificationsPermissions } from "@/features/notifications/notifications.service"
import { getXmtpConversationHmacKeys } from "@/features/xmtp/xmtp-hmac-keys/xmtp-hmac-keys"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"
import { createQueryObserverWithPreviousData } from "@/utils/react-query/react-query.helpers"
import {
  subscribeToNotificationTopicsWithMetadata,
  unsubscribeFromNotificationTopics,
} from "./notifications.api"

export function setupConversationsNotificationsSubscriptions() {
  // Set up subscription for notifications permissions changes

  createQueryObserverWithPreviousData({
    queryOptions: getNotificationsPermissionsQueryConfig(),
    observerCallbackFn: ({ data, previousData }) => {
      if (data !== previousData) {
        // notificationsLogger.debug("Notification permissions query observer triggered")
        updateConversationSubscriptions()
      }
    },
  })

  // Set up subscription for multi-inbox store changes
  useMultiInboxStore.subscribe(
    (state) => state.senders,
    (senders, previousSenders) => {
      if (senders.length !== previousSenders.length) {
        // notificationsLogger.debug("Multi-inbox senders store subscription triggered")
        updateConversationSubscriptions()
      }
    },
    {
      fireImmediately: true,
    },
  )
}

// Global map to track observers by inbox ID
const observersMap = new Map<
  IXmtpInboxId,
  ReturnType<typeof getAllowedConsentConversationsQueryObserver>
>()

// Global variable to track previous senders
let previousSendersInboxIds: IXmtpInboxId[] = []

async function updateConversationSubscriptions() {
  notificationsLogger.debug("Updating conversation subscriptions")

  // Check if notifications permissions are granted
  const hasPushNotificationPermissions = await userHasGrantedNotificationsPermissions()

  // Permissions revoked or not granted, reset everything
  if (!hasPushNotificationPermissions) {
    return unsubscribeFromAllConversationsNotifications().catch((error) =>
      captureError(
        new NotificationError({
          error,
          additionalMessage: "Failed to unsubscribe from all conversations notifications",
        }),
      ),
    )
  }

  // Get current senders from the store
  const currentSenders = useMultiInboxStore.getState().senders
  const currentInboxIds = currentSenders.map((sender) => sender.inboxId)
  const previousInboxIds = previousSendersInboxIds

  // Find inbox IDs to unsubscribe (present in previous but not in current)
  const inboxIdsToUnsubscribe = previousInboxIds.filter((id) => !currentInboxIds.includes(id))

  // Find inbox IDs to subscribe (present in current but not in previous)
  const inboxIdsToSubscribe = currentInboxIds.filter((id) => !previousInboxIds.includes(id))

  // Unsubscribe removed senders
  for (const inboxId of inboxIdsToUnsubscribe) {
    const observer = observersMap.get(inboxId)
    if (observer) {
      observer.destroy()
      observersMap.delete(inboxId)
    }
  }

  // Subscribe new senders
  for (const inboxId of inboxIdsToSubscribe) {
    setupObserverForInbox(inboxId)
  }

  // Update our tracking of previous senders
  previousSendersInboxIds = [...currentInboxIds]
}

/**
 * Sets up a query observer for a each client inbox ID
 */
function setupObserverForInbox(clientInboxId: IXmtpInboxId) {
  // Store conversation IDs for comparison
  let previousConversationIds: IXmtpConversationId[] = []

  // Create observer for the inbox
  const observer = getAllowedConsentConversationsQueryObserver({ clientInboxId })

  // Set up subscription for query changes
  observer.subscribe((query) => {
    if (!query.data) {
      return
    }

    const validConversationsIds = query.data.filter((id) => !isTempConversation(id))

    // Find conversations to unsubscribe from
    const conversationsToUnsubscribe = previousConversationIds.filter(
      (id) => !validConversationsIds.includes(id),
    )

    // Find conversations to subscribe to
    const conversationsToSubscribe = validConversationsIds.filter(
      (id) => !previousConversationIds.includes(id),
    )

    // Handle unsubscriptions
    if (conversationsToUnsubscribe.length > 0) {
      unsubscribeFromConversationsNotifications({
        conversationIds: conversationsToUnsubscribe,
        clientInboxId,
      }).catch(captureError)
    }

    // Handle new subscriptions
    if (conversationsToSubscribe.length > 0) {
      subscribeToConversationsNotifications({
        conversationIds: conversationsToSubscribe,
        clientInboxId,
      }).catch(captureError)
    }

    // Update previous conversation IDs for next comparison
    previousConversationIds = validConversationsIds
  })

  notificationsLogger.debug(
    `Successfully setup allowed consent conversations observer for inbox: ${clientInboxId}`,
  )

  // Store the observer in our map for tracking
  observersMap.set(clientInboxId, observer)
}

async function unsubscribeFromAllConversationsNotifications() {
  notificationsLogger.debug("Notifications not granted, clearing observers and unsubscribing")

  const senders = useMultiInboxStore.getState().senders

  await Promise.all(
    senders.map(async (sender) => {
      const conversationIds = await ensureAllowedConsentConversationsQueryData({
        clientInboxId: sender.inboxId,
        caller: "updateConversationSubscriptions",
      })

      await unsubscribeFromConversationsNotifications({
        conversationIds,
        clientInboxId: sender.inboxId,
      })
    }),
  )

  previousSendersInboxIds = []

  observersMap.forEach((observer) => {
    observer.destroy()
  })
  observersMap.clear()

  notificationsLogger.debug("Unsubscribed from all conversations notifications")
}

async function subscribeToConversationsNotifications(args: {
  conversationIds: IXmtpConversationId[]
  clientInboxId: IXmtpInboxId
}) {
  const { conversationIds, clientInboxId } = args

  notificationsLogger.debug(`Subscribing to ${conversationIds.length} conversations`)

  try {
    // Get installation ID once for all conversations
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: clientInboxId,
    })

    // Collect subscription data for all conversations
    const subscriptionsData = await Promise.all(
      conversationIds.map(async (conversationId) => {
        try {
          const conversation = await ensureConversationQueryData({
            clientInboxId,
            xmtpConversationId: conversationId,
            caller: "subscribeToConversationsNotifications",
          })

          if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`)
          }

          const hmacKeys = await getXmtpConversationHmacKeys({
            clientInboxId,
            conversationId,
          })

          return {
            topic: hmacKeys.topic,
            isSilent: true,
            hmacKeys: hmacKeys.hmacKeys,
          }
        } catch (error) {
          captureError(
            new NotificationError({
              error,
              additionalMessage: `Failed to prepare subscription data for conversation ${conversationId}`,
            }),
          )
          return null
        }
      }),
    )

    // Filter out nulls
    const validSubscriptions = subscriptionsData.filter(Boolean)

    if (validSubscriptions.length === 0) {
      notificationsLogger.debug("No valid subscriptions to process")
      return
    }

    // Make a single API call with all subscriptions
    await subscribeToNotificationTopicsWithMetadata({
      installationId,
      subscriptions: validSubscriptions,
    })

    notificationsLogger.debug(
      `Successfully subscribed to ${validSubscriptions.length} conversations`,
    )
  } catch (error) {
    captureError(
      new NotificationError({
        error,
        additionalMessage: `Failed to subscribe to conversations batch for inbox ${clientInboxId}`,
      }),
    )
  }
}

async function unsubscribeFromConversationsNotifications(args: {
  conversationIds: IXmtpConversationId[]
  clientInboxId: IXmtpInboxId
}) {
  const { conversationIds, clientInboxId } = args

  notificationsLogger.debug(
    `[unsubscribeFromConversationsNotifications] Unsubscribing from ${conversationIds.length} conversations`,
  )

  try {
    // Get installation ID once for all conversations
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: clientInboxId,
    })

    // Collect topics for all conversations
    const topicsData = await Promise.all(
      conversationIds.map(async (conversationId) => {
        try {
          const conversation = await ensureConversationQueryData({
            clientInboxId,
            xmtpConversationId: conversationId,
            caller: "unsubscribeFromConversationsNotifications",
          })

          if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`)
          }

          const hmacKeys = await getXmtpConversationHmacKeys({
            clientInboxId,
            conversationId,
          })

          return hmacKeys.topic
        } catch (error) {
          captureError(
            new NotificationError({
              error,
              additionalMessage: `Failed to get topic for conversation ${conversationId}`,
            }),
          )
          return null
        }
      }),
    )

    // Filter out nulls
    const validTopics = topicsData.filter(Boolean)

    if (validTopics.length === 0) {
      notificationsLogger.debug("No valid topics to unsubscribe from")
      return
    }

    // Make a single API call to unsubscribe from all topics
    await unsubscribeFromNotificationTopics({
      installationId,
      topics: validTopics,
    })

    notificationsLogger.debug(
      `Successfully unsubscribed from ${validTopics.length} conversations in batch`,
    )
  } catch (error) {
    captureError(
      new NotificationError({
        error,
        additionalMessage: `Failed to unsubscribe from conversations batch for inbox ${clientInboxId}`,
      }),
    )
  }
}
