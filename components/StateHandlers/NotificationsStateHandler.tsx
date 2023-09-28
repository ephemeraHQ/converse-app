import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { useUserStore } from "../../data/store/accountsStore";
import { saveUser } from "../../utils/api";
import { executeLogoutTasks } from "../../utils/logout";
import {
  onInteractWithNotification,
  saveNotificationsStatus,
  resetNotifications,
  shouldShowNotificationForeground,
} from "../../utils/notifications";

// This handler determines how the app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: shouldShowNotificationForeground,
});

// This handler determines how the app handles
// notifications that have been clicked on
Notifications.addNotificationResponseReceivedListener(
  onInteractWithNotification
);

export default function NotificationsStateHandler() {
  const appState = useRef(AppState.currentState);
  const userAddress = useUserStore((s) => s.userAddress);

  useEffect(() => {
    // Things to do when app opens
    saveNotificationsStatus();
    // Dismiss notifications and set badge to 0
    resetNotifications();
    executeLogoutTasks();
  }, []);

  useEffect(() => {
    // Things to do when app status changes (does NOT include first load)
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          executeLogoutTasks();
          saveNotificationsStatus();
          // Dismiss notifications and set badge to 0
          resetNotifications();
          // Save the user
          if (userAddress) {
            saveUser(userAddress);
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [userAddress]);

  return null;
}
