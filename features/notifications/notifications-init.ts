import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import {
  isNotificationExpoNewMessageNotification,
  isNotificationXmtpNewMessageNotification,
} from "@/features/notifications/notification-assertions"
import { captureError } from "@/utils/capture-error"
import { NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"
import { maybeDisplayLocalNewMessageNotification } from "./notifications.service"

// Track processed notification IDs to prevent duplicate handling

export function configureForegroundNotificationBehavior() {
  Notifications.setNotificationHandler({
    handleNotification,
    handleSuccess,
    handleError,
  })

  configureAndroidNotificationChannel()
}

const processedNotificationIds = new Set<string>()

async function handleNotification(notification: Notifications.Notification) {
  try {
    const notificationId = notification.request.identifier

    // Check if we've already processed this specific notification
    if (processedNotificationIds.has(notificationId)) {
      notificationsLogger.debug(`Skipping already processed notification: ${notificationId}`)
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }
    }

    // Mark this notification as processed
    processedNotificationIds.add(notificationId)

    // Limit the size of the Set to prevent memory leaks
    if (processedNotificationIds.size > 100) {
      const iterator = processedNotificationIds.values()
      const valueToDelete = iterator.next().value
      if (valueToDelete) {
        processedNotificationIds.delete(valueToDelete)
      }
    }

    // Check if this is already a notification we processed (has our marker)
    if (notification.request.content.data?.isProcessedByConvo) {
      // For notifications we already processed, just display them normally
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }
    }

    notificationsLogger.debug("Handling non processed notification:", notification)

    if (isNotificationXmtpNewMessageNotification(notification)) {
      await maybeDisplayLocalNewMessageNotification({
        encryptedMessage: notification.request.trigger.payload.encryptedMessage,
        topic: notification.request.trigger.payload.topic,
      })

      // Prevent the original notification from showing
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }
    }

    if (isNotificationExpoNewMessageNotification(notification)) {
      await maybeDisplayLocalNewMessageNotification({
        encryptedMessage: notification.request.content.data.idempotencyKey,
        topic: notification.request.content.data.contentTopic,
      })

      // Prevent the original notification from showing
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }
    }

    captureError(
      new NotificationError({
        error: `Unknown notification: ${JSON.stringify(notification)}`,
      }),
    )
  } catch (error) {
    captureError(
      new NotificationError({
        error,
      }),
    )
  }

  // Let's always show the notification anyway
  return {
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }
}

function handleSuccess(notificationId: string) {
  // notificationsLogger.debug(`Successfully processed notification: ${notificationId}`)
}

function handleError(notificationId: string, error: Error) {
  captureError(
    new NotificationError({
      error,
      additionalMessage: `Failed to display notification ${notificationId}`,
    }),
  )
}

async function configureAndroidNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableVibrate: true,
    }).catch(captureError)
  }
}
