import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { notificationsLogger } from "@/utils/logger";

type INotificationListenerCallbacks = {
  onNotificationDisplayedInForeground?: (
    notification: Notifications.Notification
  ) => void;
  onNotificationTappedWhileRunning?: (
    response: Notifications.NotificationResponse
  ) => void;
  onSystemDroppedNotifications?: () => void;
};

/**
 * Hook to handle notification events while app is running (foreground or background):
 * - Notifications displayed while app is in foreground
 * - User tapping notifications while app is running
 * - System dropping notifications due to limits
 */
export function useNotificationListenersWhileRunning({
  onNotificationDisplayedInForeground,
  onNotificationTappedWhileRunning,
  onSystemDroppedNotifications,
}: INotificationListenerCallbacks = {}) {
  const foregroundNotificationListener = useRef<Notifications.Subscription>();
  const notificationTapListener = useRef<Notifications.Subscription>();
  const systemDropListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications while app is in foreground
    foregroundNotificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        notificationsLogger.debug(
          `[useNotificationListenersWhileRunning] Foreground notification displayed: ${notification.request.identifier}`
        );
        onNotificationDisplayedInForeground?.(notification);
      });

    // Listen for notification taps while app is running
    notificationTapListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        onNotificationTappedWhileRunning?.(response);
      });

    // Listen for when system drops notifications
    systemDropListener.current = Notifications.addNotificationsDroppedListener(
      () => {
        notificationsLogger.debug(
          "[useNotificationListenersWhileRunning] System dropped notifications due to limits"
        );
        onSystemDroppedNotifications?.();
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      if (foregroundNotificationListener.current) {
        Notifications.removeNotificationSubscription(
          foregroundNotificationListener.current
        );
      }

      if (notificationTapListener.current) {
        Notifications.removeNotificationSubscription(
          notificationTapListener.current
        );
      }

      if (systemDropListener.current) {
        Notifications.removeNotificationSubscription(
          systemDropListener.current
        );
      }
    };
  }, [
    onNotificationDisplayedInForeground,
    onNotificationTappedWhileRunning,
    onSystemDroppedNotifications,
  ]);
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
    });
  }, []);
}

export function configureForegroundNotificationBehavior() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
    handleSuccess: (notificationId) => {
      notificationsLogger.debug(
        `Successfully displayed notification: ${notificationId}`
      );
    },
    handleError: (notificationId, error) => {
      notificationsLogger.error(
        `Failed to display notification ${notificationId}: ${error}`
      );
    },
  });
}
