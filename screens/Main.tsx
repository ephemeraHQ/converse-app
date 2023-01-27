import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  buildUserInviteTopic,
  //@ts-ignore
} from "@xmtp/xmtp-js/dist/cjs/src/utils";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import { AppState, useColorScheme } from "react-native";

import { addLog } from "../components/DebugButton";
import { sendMessageToWebview } from "../components/XmtpWebview";
import { loadDataToContext } from "../data";
import { initDb } from "../data/db";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { XmtpConversation } from "../data/store/xmtpReducer";
import { saveUser } from "../utils/api";
import {
  backgroundColor,
  navigationSecondaryBackgroundColor,
  textPrimaryColor,
} from "../utils/colors";
import { lastValueInMap } from "../utils/map";
import {
  getNotificationsPermissionStatus,
  loadSavedNotificationMessagesToContext,
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
  NewConversation: {
    peer?: string;
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
  const colorScheme = useColorScheme();
  const appState = useRef(AppState.currentState);
  const { state, dispatch } = useContext(AppContext);

  const navigateToConversation = useCallback(
    async (conversation: XmtpConversation) => {
      const lastTimestamp =
        conversation.messages?.size > 0
          ? lastValueInMap(conversation.messages)?.sent || 0
          : 0;
      addLog(`Navigating to convo ${conversation.topic} - ${lastTimestamp}`);
      await loadSavedNotificationMessagesToContext(dispatch);
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
    },
    [dispatch]
  );

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
      const conversationTopic = (
        event.notification.request.content.data as any
      )?.contentTopic?.toString();
      addLog(`Notification Interaction - ${conversationTopic}`);
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
      await loadSavedNotificationMessagesToContext(dispatch);
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
  }, [dispatch, saveNotificationsStatus]);

  const splashScreenHidden = useRef(false);

  useEffect(() => {
    if (state.xmtp.webviewLoaded && !splashScreenHidden.current) {
      splashScreenHidden.current = true;
      SplashScreen.hideAsync();
      // If app was loaded by clicking on notification,
      // let's navigate
      addLog(
        `Notification Interaction and app killed - ${topicToNavigateTo.current}`
      );
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
      const topics = [
        ...Object.keys(state.xmtp.conversations),
        buildUserInviteTopic(state.xmtp.address || ""),
      ];
      subscribeToNotifications(topics);
    }
  }, [
    state.notifications.status,
    state.xmtp.address,
    state.xmtp.conversations,
    state.xmtp.initialLoadDone,
  ]);

  useEffect(() => {
    if (!state.xmtp.connected) {
      initialNotificationsSubscribed.current = false;
    }
  }, [state.xmtp.connected]);

  useEffect(() => {
    if (state.xmtp.address) {
      saveUser(state.xmtp.address);
    }
  }, [state.xmtp.address]);

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
        NewConversation: {
          path: "/newConversation",
        },
      },
    },
  };

  return (
    <ActionSheetProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Messages">
          <Stack.Group
            screenOptions={{
              headerStyle: { backgroundColor: backgroundColor(colorScheme) },
              headerTitleStyle: { color: textPrimaryColor(colorScheme) },
            }}
          >
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
                headerStyle: {
                  backgroundColor:
                    navigationSecondaryBackgroundColor(colorScheme),
                },
              }}
            />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>
  );
}
