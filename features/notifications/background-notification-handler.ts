import * as Notifications from "expo-notifications"
import { SchedulableTriggerInputTypes } from "expo-notifications"
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
    notificationsLogger.debug("Background notification task executed", { data })

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

      notificationsLogger.debug("Received data in background task:", receivedData)

      if (!receivedData.notification) {
        notificationsLogger.warn("No notification data in background task")
        return
      }

      const notification = receivedData.notification

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

    // First check if task is already registered
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK)

    // Only register if not already registered
    if (!isTaskRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
      notificationsLogger.debug("Background notification task registered successfully")
    } else {
      notificationsLogger.debug("Background task already registered, skipping registration")
    }
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
