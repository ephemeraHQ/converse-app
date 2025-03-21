import * as Notifications from "expo-notifications"
import { captureError } from "@/utils/capture-error"
import { notificationsLogger } from "@/utils/logger"

/**
 * Intercepts and modifies incoming notifications before they are displayed to the user
 * This works reliably for foreground notifications, since we have direct control over them
 */
export function interceptAndModifyNotification(
  notification: Notifications.Notification,
): Notifications.Notification {
  // Clone the notification to avoid modifying the original object
  const modifiedNotification = { ...notification }

  try {
    // Access the notification content
    const content = notification.request.content

    // You can access notification data if your backend sends custom data
    const data = content.data || {}

    // Modify the title based on your requirements
    // For example, you could prepend a sender name or modify based on notification type
    if (content.title) {
      // Example: Add a prefix to the title or completely replace it
      // The logic here depends on what data your backend sends and how you want to format titles

      // Example 1: Adding a prefix
      modifiedNotification.request.content.title = `Convo: ${content.title}`

      // Example 2: Using data from the notification payload to create a custom title
      // if (data.senderName) {
      //   modifiedNotification.request.content.title = `Message from ${data.senderName}`
      // }

      // Example 3: Completely changing title based on notification type
      // if (data.type === 'message') {
      //   modifiedNotification.request.content.title = 'New Message Received'
      // }
    }

    notificationsLogger.debug(
      "Modified notification title:",
      modifiedNotification.request.content.title,
    )

    return modifiedNotification
  } catch (error) {
    // If there's an error during interception, log it but don't block the notification
    captureError(error)
    notificationsLogger.error("Error intercepting notification:", error)
    return notification // Return the original notification in case of error
  }
}
