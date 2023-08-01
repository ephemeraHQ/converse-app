import * as Notifications from "expo-notifications";
import { useCallback, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { AppContext } from "../../data/deprecatedStore/context";
import { NotificationsDispatchTypes } from "../../data/deprecatedStore/notificationsReducer";
import { saveUser } from "../../utils/api";
import { navigateToConversation } from "../../utils/navigation";
import {
  getNotificationsPermissionStatus,
  subscribeToNotifications,
} from "../../utils/notifications";
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

  const saveNotificationsStatus = useCallback(async () => {
    const notificationsStatus = await getNotificationsPermissionStatus();
    if (
      notificationsStatus === "undetermined" ||
      notificationsStatus === "granted" ||
      notificationsStatus === "denied"
    ) {
      dispatch({
        type: NotificationsDispatchTypes.NotificationsStatus,
        payload: { status: notificationsStatus },
      });
    }
  }, [dispatch]);

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
          if (state.xmtp.address) {
            saveUser(state.xmtp.address);
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [dispatch, saveNotificationsStatus, state.xmtp.address]);

  useEffect(() => {
    if (
      state.notifications.status === "granted" &&
      state.xmtp.initialLoadDone &&
      state.xmtp.address &&
      !state.xmtp.loading
    ) {
      subscribeToNotifications(
        state.xmtp.address,
        Object.values(state.xmtp.conversations),
        state.xmtp.blockedPeerAddresses
      );
    }
  }, [
    state.notifications.status,
    state.xmtp.address,
    state.xmtp.blockedPeerAddresses,
    state.xmtp.conversations,
    state.xmtp.initialLoadDone,
    state.xmtp.loading,
  ]);

  return null;
}
