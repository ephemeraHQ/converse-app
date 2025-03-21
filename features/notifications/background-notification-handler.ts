import * as Notifications from "expo-notifications"
import * as TaskManager from "expo-task-manager"
import { captureError } from "@/utils/capture-error"
import { NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK"

/**
 * Register a task to handle background notifications
 * This is what allows us to process notifications even when the app is closed
 */
export async function registerBackgroundNotificationTask() {
  // First, define the task handler
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    console.log("data:", data)

    if (error) {
      captureError(error)
      notificationsLogger.error("Error in background notification task:", error)
      return
    }

    if (!data) {
      notificationsLogger.warn("No data received in background notification task")
      return
    }

    try {
      // According to Expo docs, for notification tasks,
      // the data object contains a notification property
      // https://docs.expo.dev/versions/latest/sdk/notifications/#registertaskasync
      const receivedData = data as { notification: Notifications.Notification }

      if (!receivedData.notification) {
        notificationsLogger.warn("No notification data in background task")
        return
      }

      const notification = receivedData.notification

      // Here we can process the notification before it's shown to the user
      notificationsLogger.debug(
        "Processing background notification with title:",
        notification.request.content.title,
      )

      const originalTitle = notification.request.content.title || ""
      const body = notification.request.content.body || ""
      const notificationData = notification.request.content.data || {}

      // Example: Schedule a new notification with a modified title
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Convo: ${originalTitle}`,
          body: body,
          data: notificationData,
        },
        trigger: null, // Show immediately
      })

      // Returning true will prevent the original notification from being displayed
      // This effectively replaces the original notification with our modified one
      return true
    } catch (error) {
      captureError(error)
      notificationsLogger.error("Error processing background notification:", error)
      // Returning false or nothing will allow the original notification to be displayed
      return false
    }
  })

  // Then register the task
  try {
    notificationsLogger.debug("Registering background notification task...")
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
    notificationsLogger.debug("Background notification task registered successfully")
  } catch (error) {
    captureError(
      new NotificationError({
        error,
        additionalMessage: "Failed to register background notification task",
      }),
    )
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
