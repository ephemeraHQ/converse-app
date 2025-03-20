import { QueryObserver } from "@tanstack/react-query"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryObserver } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isTempConversation } from "@/features/conversation/utils/is-temp-conversation"
import { getNotificationsPermissionsQueryConfig } from "@/features/notifications/notifications-permissions.query"
import { userHasGrantedNotificationsPermissions } from "@/features/notifications/notifications.service"
import { getXmtpConversationHmacKeys } from "@/features/xmtp/xmtp-hmac-keys/xmtp-hmac-keys"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { logger, notificationsLogger } from "@/utils/logger"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import {
  subscribeToNotificationTopicsWithMetadata,
  unsubscribeFromNotificationTopics,
} from "./notifications.api"

export function setupConversationsNotificationsSubscriptions() {
  // Set up subscription for notifications permissions changes
  const permissionsObserver = new QueryObserver(
    reactQueryClient,
    getNotificationsPermissionsQueryConfig(),
  )

  permissionsObserver.subscribe(() => {
    logger.debug("[setupConversationsNotificationsSubscriptions] Notification permissions changed")
    updateConversationSubscriptions()
  })

  // Set up subscription for multi-inbox store changes
  useMultiInboxStore.subscribe(
    (state) => state.senders,
    () => {
      logger.debug("[setupConversationsNotificationsSubscriptions] Multi-inbox senders changed")
      updateConversationSubscriptions()
    },
    {
      fireImmediately: true,
    },
  )
}

/**
 * Subscribes to notifications for a specific XMTP conversation
 */
async function subscribeToConversationsNotifications(args: {
  conversationIds: IXmtpConversationId[]
  clientInboxId: IXmtpInboxId
}) {
  const { conversationIds, clientInboxId } = args

  // Check if notifications permissions are granted
  const hasPermissions = await userHasGrantedNotificationsPermissions()

  if (!hasPermissions) {
    logger.debug(
      "[subscribeToConversationsNotifications] Skipped notifications subscription - permissions not granted",
    )
    return
  }

  logger.debug(
    `[subscribeToConversationsNotifications] Subscribing to ${conversationIds.length} conversations`,
  )

  for (const conversationId of conversationIds) {
    try {
      logger.debug("[subscribeToConversationsNotifications] Subscribing to conversation", {
        conversationId,
        inboxId: clientInboxId,
      })

      const conversation = getConversationQueryData({
        clientInboxId,
        xmtpConversationId: conversationId,
      })

      if (!conversation) {
        logger.debug(
          "[subscribeToConversationsNotifications] No conversation found, skipping subscription",
          {
            conversationId,
          },
        )
        continue
      }

      logger.debug("[subscribeToConversationsNotifications] Getting installation ID")
      const installationId = await ensureXmtpInstallationQueryData({
        inboxId: clientInboxId,
      })

      logger.debug("[subscribeToConversationsNotifications] Getting HMAC keys", {
        conversationId,
      })
      const hmacKeys = await getXmtpConversationHmacKeys({
        clientInboxId,
        conversationId,
      })

      logger.debug("[subscribeToConversationsNotifications] Subscribing to notification topics", {
        installationId,
        topic: hmacKeys.topic,
      })
      await subscribeToNotificationTopicsWithMetadata({
        installationId,
        subscriptions: [
          {
            topic: hmacKeys.topic,
            isSilent: false,
            hmacKeys: hmacKeys.hmacKeys,
          },
        ],
      })

      logger.debug(
        "[subscribeToConversationsNotifications] Successfully subscribed to conversation",
        {
          conversationId,
        },
      )
    } catch (error) {
      captureError(error)
    }
  }
}

/**
 * Unsubscribes from notifications for specified XMTP conversations
 */
async function unsubscribeFromConversationsNotifications(args: {
  conversationIds: IXmtpConversationId[]
  clientInboxId: IXmtpInboxId
}) {
  const { conversationIds, clientInboxId } = args

  logger.debug(
    `[unsubscribeFromConversationsNotifications] Unsubscribing from ${conversationIds.length} conversations`,
  )

  try {
    // Get installation ID
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: clientInboxId,
    })

    // Process each conversation
    for (const conversationId of conversationIds) {
      try {
        // Get the conversation
        const conversation = getConversationQueryData({
          clientInboxId,
          xmtpConversationId: conversationId,
        })

        if (!conversation) {
          logger.debug(
            "[unsubscribeFromConversationsNotifications] No conversation found, skipping unsubscription",
            { conversationId },
          )
          continue
        }

        // Get the conversation HMAC keys to find the topic
        const hmacKeys = await getXmtpConversationHmacKeys({
          clientInboxId,
          conversationId,
        })

        // Unsubscribe from the topic
        logger.debug(
          "[unsubscribeFromConversationsNotifications] Unsubscribing from notification topic",
          {
            installationId,
            topic: hmacKeys.topic,
          },
        )

        await unsubscribeFromNotificationTopics({
          installationId,
          topics: [hmacKeys.topic],
        })

        logger.debug(
          "[unsubscribeFromConversationsNotifications] Successfully unsubscribed from conversation",
          { conversationId },
        )
      } catch (error) {
        // Log but continue with other conversations
        captureError(error)
      }
    }
  } catch (error) {
    captureError(error)
  }
}

// Global map to track observers by inbox ID
const observersMap = new Map<
  IXmtpInboxId,
  ReturnType<typeof getAllowedConsentConversationsQueryObserver>
>()

// Global variable to track previous senders
let previousSendersInboxIds: IXmtpInboxId[] = []

/**
 * Updates conversation notification subscriptions based on current permissions and senders
 */
async function updateConversationSubscriptions() {
  // Check if notifications permissions are granted
  const hasPermissions = await userHasGrantedNotificationsPermissions()

  if (!hasPermissions) {
    logger.debug(
      "[updateConversationSubscriptions] Skipped subscription setup - notification permissions not granted",
    )
    // Clean up any existing observers if permissions were revoked
    for (const [inboxId, observer] of observersMap.entries()) {
      logger.debug(
        `[updateConversationSubscriptions] Cleaning up observer for inbox ${inboxId} due to revoked permissions`,
      )
      observer.destroy()
      observersMap.delete(inboxId)
    }
    previousSendersInboxIds = []
    return
  }

  // Get current senders from the store
  const currentSenders = useMultiInboxStore.getState().senders
  const currentInboxIds = currentSenders.map((sender) => sender.inboxId)
  const previousInboxIds = previousSendersInboxIds

  // Find inbox IDs to unsubscribe (present in previous but not in current)
  const inboxIdsToUnsubscribe = previousInboxIds.filter((id) => !currentInboxIds.includes(id))

  // Find inbox IDs to subscribe (present in current but not in previous)
  const inboxIdsToSubscribe = currentInboxIds.filter((id) => !previousInboxIds.includes(id))

  notificationsLogger.debug(`Updating subscriptions for ${currentInboxIds.length} senders`, {
    inboxIdsToUnsubscribe,
    inboxIdsToSubscribe,
  })

  // Unsubscribe removed senders
  for (const inboxId of inboxIdsToUnsubscribe) {
    const observer = observersMap.get(inboxId)
    if (observer) {
      logger.debug(`[updateConversationSubscriptions] Unsubscribing observer for inbox ${inboxId}`)
      observer.destroy()
      observersMap.delete(inboxId)
    }
  }

  // Subscribe new senders
  for (const inboxId of inboxIdsToSubscribe) {
    logger.debug(`[updateConversationSubscriptions] Setting up observer for inbox ${inboxId}`)
    setupObserverForInbox(inboxId)
  }

  // Update our tracking of previous senders
  previousSendersInboxIds = [...currentInboxIds]
}

/**
 * Sets up a query observer for a specific inbox ID
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
      logger.debug(
        `[setupObserverForInbox] Unsubscribing from ${conversationsToUnsubscribe.length} conversations for inbox ${clientInboxId}`,
      )
      unsubscribeFromConversationsNotifications({
        conversationIds: conversationsToUnsubscribe,
        clientInboxId,
      }).catch(captureError)
    }

    // Handle new subscriptions
    if (conversationsToSubscribe.length > 0) {
      logger.debug(
        `[setupObserverForInbox] Subscribing to ${conversationsToSubscribe.length} conversations for inbox ${clientInboxId}`,
      )
      subscribeToConversationsNotifications({
        conversationIds: conversationsToSubscribe,
        clientInboxId,
      }).catch(captureError)
    }

    // Update previous conversation IDs for next comparison
    previousConversationIds = validConversationsIds
  })

  // Store the observer in our map for tracking
  observersMap.set(clientInboxId, observer)
}
