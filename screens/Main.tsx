import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer, StackActions } from "@react-navigation/native";
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

import { sendMessageToWebview } from "../components/XmtpWebview";
import { loadDataToContext } from "../data";
import { initDb } from "../data/db";
import { AppDispatchTypes } from "../data/store/appReducer";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { XmtpConversation } from "../data/store/xmtpReducer";
import { saveUser } from "../utils/api";
import {
  backgroundColor,
  navigationSecondaryBackgroundColor,
  textPrimaryColor,
} from "../utils/colors";
import { ethProvider } from "../utils/eth";
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
import OnboardingScreen from "./Onboarding";
import ShareProfileScreen from "./ShareProfile";

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
  ShareProfile: undefined;
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

  const initialURL = useRef("");

  useEffect(() => {
    const handleInitialDeeplink = async () => {
      initialURL.current = (await Linking.getInitialURL()) || "";
    };
    handleInitialDeeplink();
  }, []);

  const topicToNavigateTo = useRef("");

  const handleNotificationInteraction = useCallback(
    (event: Notifications.NotificationResponse) => {
      const conversationTopic = (
        event.notification.request.content.data as any
      )?.contentTopic?.toString();
      if (conversationTopic) {
        if (state.xmtp.conversations[conversationTopic]) {
          navigateToConversation(state.xmtp.conversations[conversationTopic]);
        } else {
          // App was probably not loaded!
          topicToNavigateTo.current = conversationTopic;
        }
      }
    },
    [navigateToConversation, state.xmtp.conversations]
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

  const splashScreenHidden = useRef(false);

  useEffect(() => {
    if (state.xmtp.webviewLoaded && !splashScreenHidden.current) {
      splashScreenHidden.current = true;
      SplashScreen.hideAsync();
      dispatch({
        type: AppDispatchTypes.AppHideSplashscreen,
        payload: {
          hide: true,
        },
      });
      // If app was loaded by clicking on notification,
      // let's navigate
      if (topicToNavigateTo.current) {
        if (state.xmtp.conversations[topicToNavigateTo.current]) {
          navigateToConversation(
            state.xmtp.conversations[topicToNavigateTo.current]
          );
        }
        topicToNavigateTo.current = "";
      } else if (initialURL.current) {
        Linking.openURL(initialURL.current);
      }
    }
  }, [
    dispatch,
    navigateToConversation,
    state.xmtp.conversations,
    state.xmtp.webviewLoaded,
  ]);

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
      ethProvider
        .lookupAddress(state.xmtp.address)
        .then((result) => {
          if (result) {
            dispatch({
              type: AppDispatchTypes.AppSetMainIdentity,
              payload: { identity: result },
            });
          } else {
            dispatch({
              type: AppDispatchTypes.AppSetMainIdentity,
              payload: { identity: "" },
            });
          }
        })
        .catch((e) => {
          console.log(e);
          dispatch({
            type: AppDispatchTypes.AppSetMainIdentity,
            payload: { identity: "" },
          });
        });
    } else {
      dispatch({
        type: AppDispatchTypes.AppSetMainIdentity,
        payload: { identity: "" },
      });
    }
  }, [state.xmtp.address, dispatch]);

  const navigationState = useRef<any>(undefined);

  if (!state.xmtp.connected) return <OnboardingScreen />;

  if (
    state.notifications.showNotificationsScreen &&
    state.notifications.status === "undetermined"
  ) {
    return <NotificationsScreen />;
  }

  const linking = {
    prefixes: [prefix],
    config: {
      initialRouteName: "Messages",
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
      <NavigationContainer
        linking={state.app.splashScreenHidden ? (linking as any) : undefined}
      >
        <Stack.Navigator
          initialRouteName="Messages"
          screenListeners={({ navigation }) => ({
            state: (e: any) => {
              // Fix deeplink if already on NewConversation but changing params
              // (for instance scanning a QRCode)
              const oldRoutes = navigationState.current?.state.routes || [];
              const newRoutes = e.data?.state?.routes || [];

              if (oldRoutes.length > 0 && newRoutes.length > 0) {
                const lastRouteOld = oldRoutes[oldRoutes.length - 1];
                const lastRouteNew = newRoutes[newRoutes.length - 1];
                if (
                  lastRouteOld.key === lastRouteNew.key &&
                  lastRouteOld.name === "NewConversation"
                ) {
                  navigation.dispatch(
                    StackActions.replace(lastRouteNew.name, lastRouteNew.params)
                  );
                }
              }
              navigationState.current = e.data;
            },
          })}
        >
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
            <Stack.Screen
              name="ShareProfile"
              component={ShareProfileScreen}
              options={{
                headerTitle: "Your Converse link",
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
