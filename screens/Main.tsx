import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { AppContext } from "../store/context";
import { NotificationsDispatchTypes } from "../store/notificationsReducer";
import {
  getNotificationsPermissionStatus,
  subscribeToNotifications,
} from "../utils/notifications";
import { shortAddress } from "../utils/str";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";
import NotificationsScreen from "./NotificationsScreen";

export type NavigationParamList = {
  Messages: undefined;
  Conversation: {
    topic: string;
  };
};

const Stack = createNativeStackNavigator<NavigationParamList>();
const prefix = Linking.createURL("/");

// This handler determines how your app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Main() {
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
      const conversationTopic =
        event.notification.request.content.data?.contentTopic?.toString();
      if (conversationTopic && state.xmtp.conversations[conversationTopic]) {
        Linking.openURL(
          Linking.createURL("/conversation", {
            queryParams: {
              topic: conversationTopic,
            },
          })
        );
      }
    },
    [state.xmtp.conversations]
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
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [saveNotificationsStatus]);

  useEffect(() => {
    if (state.xmtp.webviewLoaded) {
      SplashScreen.hideAsync();
    }
  }, [state.xmtp.webviewLoaded]);

  const initialNotificationsSubscribed = useRef(false);

  useEffect(() => {
    if (
      state.notifications.status === "granted" &&
      state.xmtp.conversationsLoaded &&
      !initialNotificationsSubscribed.current
    ) {
      initialNotificationsSubscribed.current = true;
      const topics = Object.keys(state.xmtp.conversations);
      subscribeToNotifications(topics);
    }
  }, [
    state.notifications.status,
    state.xmtp.conversations,
    state.xmtp.conversationsLoaded,
  ]);

  useEffect(() => {
    if (!state.xmtp.connected) {
      initialNotificationsSubscribed.current = false;
    }
  }, [state.xmtp.connected]);

  if (!state.xmtp.connected) return null;

  if (
    state.notifications.showNotificationsScreen &&
    state.notifications.status === "undetermined"
  ) {
    return <NotificationsScreen />;
  }

  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        Messages: "/",
        Conversation: {
          path: "/conversation",
          parse: {
            topic: decodeURIComponent,
          },
          stringify: {
            topic: encodeURIComponent,
          },
        },
      },
    },
  };

  return (
    <ActionSheetProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Messages">
          <Stack.Screen
            name="Messages"
            component={ConversationList}
            options={{
              headerTitle: "Messages",
              headerLargeTitle: true,
            }}
          />
          <Stack.Screen
            name="Conversation"
            component={Conversation}
            options={({ route }) => {
              const conversation = state.xmtp.conversations[route.params.topic];
              if (conversation) {
                return {
                  title: shortAddress(conversation.peerAddress),
                };
              } else {
                return {
                  title: "Conversation",
                };
              }
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>
  );
}
