import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getStateFromPath,
  NavigationContainer,
  StackActions,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  buildUserInviteTopic,
  buildUserIntroTopic,
  //@ts-ignore
} from "@xmtp/xmtp-js/dist/cjs/src/utils";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform, useColorScheme } from "react-native";

import { addLog } from "../components/DebugButton";
import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { loadDataToContext } from "../data";
import { initDb } from "../data/db";
import { AppDispatchTypes } from "../data/store/appReducer";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { XmtpConversation, XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { saveUser } from "../utils/api";
import { loadSavedNotificationMessagesToContext } from "../utils/backgroundNotifications/loadSavedNotifications";
import {
  backgroundColor,
  headerTitleStyle,
  navigationSecondaryBackgroundColor,
} from "../utils/colors";
import { ethProvider } from "../utils/eth";
import { loadXmtpKeys } from "../utils/keychain";
import { lastValueInMap } from "../utils/map";
// import { setNavigationBarColor } from "../utils/navigationBar";
import {
  getNotificationsPermissionStatus,
  subscribeToNotifications,
} from "../utils/notifications";
import { getLoggedXmtpAddress } from "../utils/sharedData/sharedData";
import { hideSplashScreen } from "../utils/splash/splash";
import { getXmtpClientFromKeys } from "../utils/xmtp";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";
import NewConversation from "./NewConversation";
import NotificationsScreen from "./NotificationsScreen";
import OnboardingScreen from "./Onboarding";
import ShareProfileScreen from "./ShareProfile";

export type NavigationParamList = {
  Messages: undefined;
  Conversation: {
    topic?: string;
    message?: string;
    focus?: boolean;
    mainConversationWithPeer?: string;
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

const universalLinkPrefixes = [
  `https://${config.websiteDomain}/`,
  `http://${config.websiteDomain}/`,
  config.websiteDomain,
];

export default function Main() {
  const colorScheme = useColorScheme();
  const appState = useRef(AppState.currentState);
  const { state, dispatch } = useContext(AppContext);

  // setNavigationBarColor(colorScheme);

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
      let openedViaURL = (await Linking.getInitialURL()) || "";
      // Handling universal links by saving a schemed URI
      universalLinkPrefixes.forEach((prefix) => {
        if (openedViaURL.startsWith(prefix)) {
          openedViaURL = Linking.createURL(openedViaURL.replace(prefix, ""));
        }
      });
      initialURL.current = openedViaURL;
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

  const [hydrationDone, setHydrationDone] = useState(false);

  // Initial hydration
  useEffect(() => {
    const hydrate = async () => {
      // Let's rehydrate value before hiding splash
      const showNotificationsScreen = await AsyncStorage.getItem(
        "state.notifications.showNotificationsScreen"
      );
      const isDemoAccount = await AsyncStorage.getItem(
        "state.app.isDemoAccount"
      );
      if (isDemoAccount) {
        dispatch({
          type: AppDispatchTypes.AppSetDemoAccount,
          payload: {
            isDemoAccount: true,
          },
        });
      }
      let xmtpAddress = null;
      try {
        xmtpAddress = await getLoggedXmtpAddress();
      } catch {
        console.log("Error: failed to load saved logged XMTP Address");
        addLog("Error: failed to load saved logged XMTP Address");
      }
      await initDb();

      await loadDataToContext(dispatch);
      await loadSavedNotificationMessagesToContext(dispatch);
      if (showNotificationsScreen) {
        dispatch({
          type: NotificationsDispatchTypes.NotificationsShowScreen,
          payload: {
            show: showNotificationsScreen !== "0",
          },
        });
      }

      if (xmtpAddress) {
        dispatch({
          type: XmtpDispatchTypes.XmtpSetAddress,
          payload: {
            address: xmtpAddress,
          },
        });
      } else {
        const keys = await loadXmtpKeys();
        if (keys) {
          const parsedKeys = JSON.parse(keys);
          const xmtpClient = await getXmtpClientFromKeys(parsedKeys);
          dispatch({
            type: XmtpDispatchTypes.XmtpSetAddress,
            payload: {
              address: xmtpClient.address,
            },
          });
        }
      }
      addLog("Hydration 100% OK");
      setHydrationDone(true);
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hideSplashScreenIfReady = async () => {
      if (!splashScreenHidden.current && hydrationDone) {
        splashScreenHidden.current = true;

        hideSplashScreen();
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
    };
    hideSplashScreenIfReady();
  }, [
    dispatch,
    hydrationDone,
    navigateToConversation,
    state.xmtp.conversations,
  ]);

  const initialNotificationsSubscribed = useRef(false);

  useEffect(() => {
    if (
      state.notifications.status === "granted" &&
      state.xmtp.initialLoadDone &&
      !initialNotificationsSubscribed.current &&
      state.xmtp.address
    ) {
      initialNotificationsSubscribed.current = true;
      const topics = [
        ...Object.keys(state.xmtp.conversations),
        buildUserIntroTopic(state.xmtp.address || ""),
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

  if (!state.app.splashScreenHidden) return null;

  const statusBar = (
    <StatusBar
      hidden={false}
      backgroundColor={backgroundColor(colorScheme)}
      style={colorScheme === "dark" ? "light" : "dark"}
    />
  );

  if (!state.xmtp.address)
    return (
      <>
        {statusBar}
        <OnboardingScreen />
      </>
    );

  if (
    state.notifications.showNotificationsScreen &&
    (state.notifications.status === "undetermined" ||
      (state.notifications.status === "denied" && Platform.OS === "android"))
  ) {
    return (
      <>
        {statusBar}
        <NotificationsScreen />
      </>
    );
  }

  const linking = {
    prefixes: [prefix, ...universalLinkPrefixes],
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
        ShareProfile: {
          path: "/shareProfile",
        },
      },
    },
    getStateFromPath: (path: string, options: any) => {
      // dm method must link to the Conversation Screen as well
      // but prefilling the parameters
      let pathForState = path;
      if (pathForState.startsWith("dm?peer=")) {
        const peer = pathForState.slice(8).trim().toLowerCase();
        pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
      } else if (pathForState.startsWith("dm/")) {
        const peer = pathForState.slice(3).trim().toLowerCase();
        pathForState = `conversation?mainConversationWithPeer=${peer}&focus=true`;
      }
      const state = getStateFromPath(pathForState, options);
      return state;
    },
  };

  return (
    <>
      {statusBar}
      <ActionSheetProvider>
        <NavigationContainer
          linking={state.app.splashScreenHidden ? (linking as any) : undefined}
        >
          <Stack.Navigator
            initialRouteName="Messages"
            screenListeners={({ navigation }) => ({
              state: (e: any) => {
                // Fix deeplink if already on a screen but changing params
                const oldRoutes = navigationState.current?.state.routes || [];
                const newRoutes = e.data?.state?.routes || [];

                if (oldRoutes.length > 0 && newRoutes.length > 0) {
                  const currentRoute = oldRoutes[oldRoutes.length - 1];
                  const newRoute = newRoutes[newRoutes.length - 1];
                  let shouldReplace = false;
                  if (
                    currentRoute.key === newRoute.key &&
                    currentRoute.name === newRoute.name
                  ) {
                    // We're talking about the same screen!
                    if (
                      newRoute.name === "NewConversation" &&
                      newRoute.params?.peer &&
                      currentRoute.params?.peer !== newRoute.params?.peer
                    ) {
                      shouldReplace = true;
                    } else if (
                      newRoute.name === "Conversation" &&
                      newRoute.params?.mainConversationWithPeer &&
                      newRoute.params?.mainConversationWithPeer !==
                        currentRoute.params?.mainConversationWithPeer
                    ) {
                      shouldReplace = true;
                    }
                  }
                  if (shouldReplace) {
                    navigation.dispatch(
                      StackActions.replace(newRoute.name, newRoute.params)
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
                headerTitleStyle: headerTitleStyle(colorScheme),
                headerShadowVisible: Platform.OS !== "android",
              }}
            >
              <Stack.Screen
                name="Messages"
                component={ConversationList}
                options={{
                  headerTitle: "Messages",
                  headerLargeTitle: true,
                  headerTitleStyle: {
                    ...headerTitleStyle(colorScheme),
                    ...Platform.select({
                      default: {},
                      android: { fontSize: 22, lineHeight: 26 },
                    }),
                  },
                }}
              />
              <Stack.Screen name="Conversation" component={Conversation} />
              <Stack.Screen
                name="NewConversation"
                component={NewConversation}
                options={{
                  headerTitle: "New conversation",
                  presentation: "modal",
                  animation: "slide_from_right",
                  animationTypeForReplace: "push",
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
    </>
  );
}
