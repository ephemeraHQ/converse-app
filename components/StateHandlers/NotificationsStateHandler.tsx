import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  useChatStore,
  useSettingsStore,
  useUserStore,
} from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { saveUser } from "../../utils/api";
import {
  onInteractWithNotification,
  saveNotificationsStatus,
  subscribeToNotifications,
  resetNotifications,
} from "../../utils/notifications";
import { pick } from "../../utils/objects";

// This handler determines how the app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

Notifications.addNotificationResponseReceivedListener(
  onInteractWithNotification
);

export default function NotificationsStateHandler() {
  const appState = useRef(AppState.currentState);
  const userAddress = useUserStore((s) => s.userAddress);
  const { initialLoadDone, resyncing, conversations, deletedTopics } =
    useChatStore((s) =>
      pick(s, [
        "initialLoadDone",
        "resyncing",
        "conversations",
        "deletedTopics",
      ])
    );
  const blockedPeers = useSettingsStore((s) => s.blockedPeers);
  const { notificationsPermissionStatus } = useAppStore((s) =>
    pick(s, ["notificationsPermissionStatus"])
  );

  useEffect(() => {
    // Things to do when app opens
    saveNotificationsStatus();
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
          // App is back to active state
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

  useEffect(() => {
    if (
      notificationsPermissionStatus === "granted" &&
      initialLoadDone &&
      userAddress &&
      !resyncing
    ) {
      subscribeToNotifications(
        userAddress,
        Object.values(conversations),
        blockedPeers,
        deletedTopics
      );
    }
  }, [
    notificationsPermissionStatus,
    userAddress,
    blockedPeers,
    deletedTopics,
    conversations,
    initialLoadDone,
    resyncing,
  ]);

  return null;
}
