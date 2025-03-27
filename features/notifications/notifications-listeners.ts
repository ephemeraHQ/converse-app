import * as Notifications from "expo-notifications"
import { useEffect, useRef } from "react"
import {
  isConvosModifiedNotification,
  isNotificationXmtpNewMessageNotification,
} from "@/features/notifications/notification-assertions"
import { getXmtpConversationIdFromXmtpTopic } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { navigate } from "@/navigation/navigation.utils"
import { captureError } from "@/utils/capture-error"
import { NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"

export function useNotificationListeners() {
  const foregroundNotificationListener = useRef<Notifications.Subscription>()
  const notificationTapListener = useRef<Notifications.Subscription>()
  // const systemDropListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    // Listen for notifications while app is in foreground
    foregroundNotificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // notificationsLogger.debug(`Handling foreground notification:`, notification)
      },
    )

    // Listen for notification taps while app is running
    notificationTapListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        try {
          notificationsLogger.debug(`Notification tapped: ${JSON.stringify(response)}`)

          if (isConvosModifiedNotification(response.notification)) {
            navigate("Conversation", {
              xmtpConversationId:
                response.notification.request.content.data.message.xmtpConversationId,
            }).catch(captureError)
          } else if (isNotificationXmtpNewMessageNotification(response.notification)) {
            navigate("Conversation", {
              xmtpConversationId: getXmtpConversationIdFromXmtpTopic(
                response.notification.request.trigger.payload.topic,
              ),
            }).catch(captureError)
          } else {
            captureError(
              new NotificationError({
                error: `Unknown notification type: ${JSON.stringify(response.notification)}`,
              }),
            )
          }
        } catch (error) {
          captureError(
            new NotificationError({
              error,
              additionalMessage: "Error handling notification tap",
            }),
          )
        }
      },
    )

    // // Listen for when system drops notifications
    // Causing an error on iOS
    // systemDropListener.current = Notifications.addNotificationsDroppedListener(() => {
    //   notificationsLogger.debug(
    //     "[useNotificationListenersWhileRunning] System dropped notifications due to limits",
    //   )
    //   onSystemDroppedNotifications?.()
    // })

    // Cleanup subscriptions on unmount
    return () => {
      if (foregroundNotificationListener.current) {
        Notifications.removeNotificationSubscription(foregroundNotificationListener.current)
      }

      if (notificationTapListener.current) {
        Notifications.removeNotificationSubscription(notificationTapListener.current)
      }

      // if (systemDropListener.current) {
      //   Notifications.removeNotificationSubscription(systemDropListener.current)
      // }
    }
  }, [])
}

/**
 * Hook to handle when app was launched from a killed state by tapping a notification.
 * This is different from onNotificationTappedWhileRunning because it handles the case
 * where the app was completely closed when the user tapped the notification.
 */
export function useNotificationTappedWhileKilled() {
  useEffect(() => {
    // Check if app was launched by tapping a notification while killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        // TODO
      }
    })
  }, [])
}
