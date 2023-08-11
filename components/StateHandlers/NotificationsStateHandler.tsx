import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import {
  useChatStore,
  useSettingsStore,
  useUserStore,
} from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { saveUser } from "../../utils/api";
import { navigateToConversation } from "../../utils/navigation";
import {
  getNotificationsPermissionStatus,
  subscribeToNotifications,
} from "../../utils/notifications";
import { pick } from "../../utils/objects";
import { setTopicToNavigateTo } from "./InitialStateHandler";

// This handler determines how the app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function NotificationsStateHandler() {
  const appState = useRef(AppState.currentState);
  const userAddress = useUserStore((s) => s.userAddress);
  const { initialLoadDone, resyncing, conversations } = useChatStore((s) =>
    pick(s, ["initialLoadDone", "resyncing", "conversations"])
  );
  const blockedPeers = useSettingsStore((s) => s.blockedPeers);
  const { setNotificationsPermissionStatus, notificationsPermissionStatus } =
    useAppStore((s) =>
      pick(s, [
        "notificationsPermissionStatus",
        "setNotificationsPermissionStatus",
      ])
    );

  const saveNotificationsStatus = useCallback(async () => {
    const notificationsStatus = await getNotificationsPermissionStatus();
    if (
      notificationsStatus === "undetermined" ||
      notificationsStatus === "granted" ||
      notificationsStatus === "denied"
    ) {
      setNotificationsPermissionStatus(notificationsStatus);
    }
  }, [setNotificationsPermissionStatus]);

  const handleNotificationWhileForegrounded = useCallback(
    (event: Notifications.Notification) => {
      // Received a notification while in foreground
    },
    []
  );

  const handleNotificationInteraction = useCallback(
    (event: Notifications.NotificationResponse) => {
      const notificationData = event.notification.request.content.data;
      if (!notificationData) return;
      const newConversationTopic = notificationData["newConversationTopic"] as
        | string
        | undefined;
      const messageConversationTopic = notificationData["contentTopic"] as
        | string
        | undefined;
      const conversationTopic =
        newConversationTopic || messageConversationTopic;
      if (conversationTopic) {
        if (conversations[conversationTopic]) {
          navigateToConversation(conversations[conversationTopic]);
        } else {
          // App was probably not loaded!
          setTopicToNavigateTo(conversationTopic);
        }
      }
    },
    [conversations]
  );

  useEffect(() => {
    // Things to do when app opens
    saveNotificationsStatus();
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener(
        handleNotificationWhileForegrounded
      );
    const interactionSubscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationInteraction
      );

    return () => {
      Notifications.removeNotificationSubscription(foregroundSubscription);
      Notifications.removeNotificationSubscription(interactionSubscription);
    };
  }, [
    handleNotificationInteraction,
    handleNotificationWhileForegrounded,
    saveNotificationsStatus,
  ]);

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
  }, [saveNotificationsStatus, userAddress]);

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
        blockedPeers
      );
    }
  }, [
    notificationsPermissionStatus,
    userAddress,
    blockedPeers,
    conversations,
    initialLoadDone,
    resyncing,
  ]);

  return null;
}
