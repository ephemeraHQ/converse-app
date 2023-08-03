import * as Notifications from "expo-notifications";
import { useCallback, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { AppContext } from "../../data/deprecatedStore/context";
import { useUserStore } from "../../data/store/accountsStore";
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
  const { state, dispatch } = useContext(AppContext);
  const userAddress = useUserStore((s) => s.userAddress);
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
      const conversationTopic = (
        event.notification.request.content.data as any
      )?.contentTopic?.toString();
      if (conversationTopic) {
        if (state.xmtp.conversations[conversationTopic]) {
          navigateToConversation(
            dispatch,
            state.xmtp.conversations[conversationTopic]
          );
        } else {
          // App was probably not loaded!
          setTopicToNavigateTo(conversationTopic);
        }
      }
    },
    [dispatch, state.xmtp.conversations]
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
  }, [dispatch, saveNotificationsStatus, userAddress]);

  useEffect(() => {
    if (
      notificationsPermissionStatus === "granted" &&
      state.xmtp.initialLoadDone &&
      userAddress &&
      !state.xmtp.loading
    ) {
      subscribeToNotifications(
        userAddress,
        Object.values(state.xmtp.conversations),
        state.xmtp.blockedPeerAddresses
      );
    }
  }, [
    notificationsPermissionStatus,
    userAddress,
    state.xmtp.blockedPeerAddresses,
    state.xmtp.conversations,
    state.xmtp.initialLoadDone,
    state.xmtp.loading,
  ]);

  return null;
}
