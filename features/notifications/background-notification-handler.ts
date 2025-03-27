import * as Notifications from "expo-notifications"
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
    // Doing this for now to prevent duplicate registrations since we're still testing this feature
    await unregisterAllBackgroundTasks()

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

// /**
//  * Unregisters the background notification task
//  * Use this to clean up the task or when you need to restart fresh
//  */
// async function unregisterBackgroundNotificationTask() {
//   try {
//     notificationsLogger.debug("Unregistering background notification task...")
//     await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK)
//     notificationsLogger.debug("Background notification task unregistered successfully")
//   } catch (error) {
//     captureError(
//       new NotificationError({
//         error,
//         additionalMessage: "Failed to unregister background notification task",
//       }),
//     )
//   }
// }

/**
 * Unregisters all tasks associated with the application
 * Use this to completely clean up and start fresh
 */
async function unregisterAllBackgroundTasks() {
  try {
    notificationsLogger.debug("Unregistering all background tasks...")
    await TaskManager.unregisterAllTasksAsync()
    notificationsLogger.debug("All background tasks unregistered successfully")
  } catch (error) {
    captureError(
      new NotificationError({
        error,
        additionalMessage: "Failed to unregister all background tasks",
      }),
    )
  }
}
