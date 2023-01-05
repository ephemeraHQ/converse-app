import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import { AppState, useColorScheme } from "react-native";

import { sendMessageToWebview } from "../components/XmtpWebview";
import { loadDataToContext } from "../data";
import { initDb } from "../data/db";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { XmtpConversation } from "../data/store/xmtpReducer";
import { lastValueInMap } from "../utils/map";
import {
  getNotificationsPermissionStatus,
  subscribeToNotifications,
} from "../utils/notifications";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";
import NewConversation from "./NewConversation";
import NotificationsScreen from "./NotificationsScreen";

export type NavigationParamList = {
  Messages: undefined;
  Conversation: {
    topic: string;
    message?: string;
    focus?: boolean;
  };
  NewConversation: undefined;
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

const navigateToConversation = (conversation: XmtpConversation) => {
  const lastTimestamp =
    conversation.messages?.size > 0
      ? lastValueInMap(conversation.messages)?.sent || 0
      : 0;
  sendMessageToWebview("SYNC_CONVERSATION", {
    conversationTopic: conversation.topic,
    lastTimestamp,
  });
  Linking.openURL(
    Linking.createURL("/conversation", {
      queryParams: {
        topic: conversation.topic,
      },
    })
  );
};

export default function Main() {
  const appState = useRef(AppState.currentState);
  const { state, dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  console.log("color scheme is", colorScheme);

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

  const topicToNavigateTo = useRef("");

  const handleNotificationInteraction = useCallback(
    (event: Notifications.NotificationResponse) => {
      const conversationTopic =
        event.notification.request.content.data?.contentTopic?.toString();
      if (conversationTopic) {
        if (state.xmtp.conversations[conversationTopic]) {
          navigateToConversation(state.xmtp.conversations[conversationTopic]);
        } else {
          // App was probably not loaded!
          topicToNavigateTo.current = conversationTopic;
        }
      }
    },
    [state.xmtp.conversations]
  );

  useEffect(() => {
    const loadData = async () => {
      await initDb();
      await loadDataToContext(dispatch);
    };
    loadData();
  }, [dispatch]);

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

  const splashScreenHidden = useRef(false);

  useEffect(() => {
    if (state.xmtp.webviewLoaded && !splashScreenHidden.current) {
      splashScreenHidden.current = true;
      SplashScreen.hideAsync();
      // If app was loaded by clicking on notification,
      // let's navigate
      if (topicToNavigateTo.current) {
        if (state.xmtp.conversations[topicToNavigateTo.current]) {
          navigateToConversation(
            state.xmtp.conversations[topicToNavigateTo.current]
          );
        }
        topicToNavigateTo.current = "";
      }
    }
  }, [state.xmtp.conversations, state.xmtp.webviewLoaded]);

  const initialNotificationsSubscribed = useRef(false);

  useEffect(() => {
    if (
      state.notifications.status === "granted" &&
      state.xmtp.initialLoadDone &&
      !initialNotificationsSubscribed.current
    ) {
      initialNotificationsSubscribed.current = true;
      const topics = Object.keys(state.xmtp.conversations);
      subscribeToNotifications(topics);
    }
  }, [
    state.notifications.status,
    state.xmtp.conversations,
    state.xmtp.initialLoadDone,
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
          <Stack.Screen name="Conversation" component={Conversation} />
          <Stack.Screen
            name="NewConversation"
            component={NewConversation}
            options={{
              headerTitle: "New conversation",
              presentation: "modal",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>
  );
}
