import * as Notifications from "expo-notifications"
import { SchedulableTriggerInputTypes } from "expo-notifications"
import * as TaskManager from "expo-task-manager"
import { IXmtpNewMessageBackgroundNotificationData } from "@/features/notifications/notifications.types"
import { IXmtpConversationTopic } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"
import { maybeDisplayLocalNewMessageNotification } from "./notifications.service"

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK"

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  try {
    if (error) {
      throw new NotificationError({
        error,
      })
    }

    if (!data) {
      throw new NotificationError({
        error: "No data received in background notification task",
      })
    }

    const backgroundNotificationData = data as IXmtpNewMessageBackgroundNotificationData

    notificationsLogger.debug("Background notification task executed", {
      backgroundNotificationData,
    })

    if (!backgroundNotificationData.UIApplicationLaunchOptionsRemoteNotificationKey) {
      throw new NotificationError({
        error: `Wrong background notification data? ${JSON.stringify(backgroundNotificationData)}`,
      })
    }

    await maybeDisplayLocalNewMessageNotification({
      encryptedMessage:
        backgroundNotificationData.UIApplicationLaunchOptionsRemoteNotificationKey.encryptedMessage,
      topic: backgroundNotificationData.UIApplicationLaunchOptionsRemoteNotificationKey
        .topic as IXmtpConversationTopic,
    })

    // Not sure? to verify...
    // Returning true will prevent the original notification from being displayed
    // This effectively replaces the original notification with our modified one
    return true
  } catch (error) {
    captureError(
      new NotificationError({
        error,
        additionalMessage: "Error in background notification task",
      }),
      {
        extras: {
          backgroundNotificationData: JSON.stringify(data || {}),
        },
      },
    )
    // Not sure? to verify...
    // Returning false or nothing will allow the original notification to be displayed
    return false
  }
})

/**
 * Register a task to handle background notifications
 * This is what allows us to process notifications even when the app is closed
 */
export async function registerBackgroundNotificationTask() {
  try {
    notificationsLogger.debug("Registering background notification task...")
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
    notificationsLogger.debug("Background notification task registered successfully")
  } catch (error) {
    throw new NotificationError({
      error,
      additionalMessage: "Failed to register background notification task",
    })
  }
}

/**
 * Tests the background notification handling by sending a test notification
 * Call this function to verify if your background notification task is working properly
 */
export async function testBackgroundNotificationTask() {
  try {
    notificationsLogger.debug("Scheduling test notification to verify background task...")

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Background Task",
        body: "This notification should be intercepted and modified",
        data: { test: true },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    })

    notificationsLogger.debug("Test notification scheduled with ID:", notificationId)

    return notificationId
  } catch (error) {
    captureError(
      new NotificationError({
        error,
        additionalMessage: "Failed to schedule test notification",
      }),
    )
    throw error
  }
}

/**
 * Set up notification categories with custom actions
 * These define how notifications behave when received in the background
 */
// async function setupNotificationCategories() {
//   try {
//     // Create a default notification category with custom actions
//     await Notifications.setNotificationCategoryAsync("default", [
//       {
//         identifier: "view",
//         buttonTitle: "View",
//         options: {
//           opensAppToForeground: true,
//         },
//       },
//       {
//         identifier: "dismiss",
//         buttonTitle: "Dismiss",
//         options: {
//           opensAppToForeground: false,
//         },
//       },
//     ])

//     notificationsLogger.debug("Notification categories set up successfully")
//   } catch (error) {
//     captureError(error)
//     notificationsLogger.error("Error setting up notification categories:", error)
//   }
// }
