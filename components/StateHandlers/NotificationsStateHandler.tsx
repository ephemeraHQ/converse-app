import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  useCurrentAccount,
  useAccountsList,
  getChatStore,
  getSettingsStore,
} from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { saveUser } from "../../utils/api";
import { sortAndComputePreview } from "../../utils/conversation";
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
  const userAddress = useCurrentAccount();

  useEffect(() => {
    // Things to do when app opens
    saveNotificationsStatus();
    // Dismiss notifications and set badge to 0
    resetNotifications(500);
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
          resetNotifications(500);
          // Save the user
          if (userAddress) {
            saveUser(userAddress);
          }
        } else {
          // Things to do when app status changes to inactive
          resetNotifications();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [userAddress]);

  const accounts = useAccountsList();
  const hydrationDone = useAppStore((s) => s.hydrationDone);

  // Sync accounts on load and when a new one is added
  useEffect(() => {
    if (!hydrationDone) return;
    accounts.forEach((a) => {
      // Let's sortAndComputePreview to subscribe to the right notifications
      const { conversations, topicsStatus, conversationsSortedOnce } =
        getChatStore(a).getState();
      if (!conversationsSortedOnce) {
        const { peersStatus } = getSettingsStore(a).getState();
        sortAndComputePreview(conversations, a, topicsStatus, peersStatus);
      }
    });
  }, [accounts, hydrationDone]);

  return null;
}
