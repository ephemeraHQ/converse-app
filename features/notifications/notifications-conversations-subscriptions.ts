import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryObserver } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { getXmtpConversationHmacKeys } from "@/features/xmtp/xmtp-hmac-keys/xmtp-hmac-keys"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { logger, notificationsLogger } from "@/utils/logger"
import {
  subscribeToNotificationTopicsWithMetadata,
  unsubscribeFromNotificationTopics,
} from "./notifications.api"

/**
 * Subscribes to notifications for a specific XMTP conversation
 */
async function subscribeToConversationsNotifications(args: {
  conversationIds: IXmtpConversationId[]
  clientInboxId: IXmtpInboxId
}) {
  const { conversationIds, clientInboxId } = args

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

export function setupConversationsNotificationsSubscriptions() {
  useMultiInboxStore.subscribe(
    (state) => state.senders,
    (previousSenders, currentSenders) => {
      const currentInboxIds = currentSenders.map((sender) => sender.inboxId)
      const previousInboxIds = previousSenders.map((sender) => sender.inboxId)

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
          logger.debug(
            `[setupConversationNotificationsObserver] Unsubscribing observer for inbox ${inboxId}`,
          )
          observer.destroy()
          observersMap.delete(inboxId)
        }
      }

      // Subscribe new senders
      for (const inboxId of inboxIdsToSubscribe) {
        logger.debug(
          `[setupConversationNotificationsObserver] Setting up observer for inbox ${inboxId}`,
        )
        setupObserverForInbox(inboxId)
      }
    },
    {
      fireImmediately: true,
    },
  )
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

    // Extract conversation IDs from the query data
    const currentConversationIds = query.data

    // Find conversations to unsubscribe from
    const conversationsToUnsubscribe = previousConversationIds.filter(
      (id) => !currentConversationIds.includes(id),
    )

    // Find conversations to subscribe to
    const conversationsToSubscribe = currentConversationIds.filter(
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
    previousConversationIds = currentConversationIds
  })

  // Store the observer in our map for tracking
  observersMap.set(clientInboxId, observer)
}
