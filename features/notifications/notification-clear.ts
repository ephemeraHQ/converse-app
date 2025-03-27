import * as Notifications from "expo-notifications"
import {
  isConvosModifiedNotification,
  isNotificationExpoNewMessageNotification,
  isNotificationXmtpNewMessageNotification,
} from "@/features/notifications/notification-assertions"
import { captureError } from "@/utils/capture-error"
import { NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"

export function clearAllNotifications() {
  notificationsLogger.debug("Clearing all notifications from notification center")
  return Notifications.dismissAllNotificationsAsync()
}

export function dismissNotification(args: { identifier: string }) {
  const { identifier } = args
  notificationsLogger.debug(`Dismissing notification with identifier: ${identifier}`)
  return Notifications.dismissNotificationAsync(identifier)
}

export async function clearConversationNotifications(args: { conversationId: string }) {
  const { conversationId } = args
  notificationsLogger.debug(`Clearing notifications for conversation: ${conversationId}`)

  try {
    // Get all displayed notifications
    const presentedNotifications = await Notifications.getPresentedNotificationsAsync()

    // Get identifiers for notifications related to this conversation
    const notificationIdentifiers = presentedNotifications
      .filter((notification) => {
        try {
          // Check if this is a Convo-processed notification
          if (isConvosModifiedNotification(notification)) {
            return notification.request.content.data.message?.xmtpConversationId === conversationId
          }

          // Check if this is an Expo new message notification
          if (isNotificationExpoNewMessageNotification(notification)) {
            // For Expo notifications, we need to check the contentTopic
            return notification.request.content.data.contentTopic === conversationId
          }

          // Check if this is an XMTP new message notification
          if (isNotificationXmtpNewMessageNotification(notification)) {
            // For XMTP notifications, we need to check the topic in the trigger payload
            return notification.request.trigger.payload.topic === conversationId
          }

          // For any other type of notification, try to check for a conversationId property
          const data = notification.request.content.data as { conversationId?: string }
          return data?.conversationId === conversationId
        } catch (error) {
          captureError(
            new NotificationError({
              error,
              additionalMessage: `Error clearing conversation notifications for conversation: ${conversationId}`,
            }),
          )
          // If we can't parse the notification data, skip it
          return false
        }
      })
      .map((notification) => notification.request.identifier)

    // Dismiss each notification for this conversation
    for (const identifier of notificationIdentifiers) {
      await Notifications.dismissNotificationAsync(identifier)
    }

    notificationsLogger.debug(
      `Cleared ${notificationIdentifiers.length} notifications for conversation: ${conversationId}`,
    )

    return notificationIdentifiers.length
  } catch (error) {
    notificationsLogger.error("Failed to clear conversation notifications", error)
    throw error
  }
}
