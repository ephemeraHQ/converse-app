import {
  getStateFromPath,
  NavigationContainer,
  StackActions,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useRef } from "react";
import { Platform, useColorScheme } from "react-native";

import ChatSendAttachment from "../components/Chat/ChatSendAttachment";
import ActionSheetStateHandler from "../components/StateHandlers/ActionSheetStateHandler";
import HydrationStateHandler from "../components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "../components/StateHandlers/InitialStateHandler";
import MainIdentityStateHandler from "../components/StateHandlers/MainIdentityStateHandler";
import NetworkStateHandler from "../components/StateHandlers/NetworkStateHandler";
import NotificationsStateHandler from "../components/StateHandlers/NotificationsStateHandler";
import config from "../config";
import { AppContext } from "../data/store/context";
import {
  backgroundColor,
  headerTitleStyle,
  navigationSecondaryBackgroundColor,
  textSecondaryColor,
} from "../utils/colors";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";
import ConverseMatchMaker from "./ConverseMatchMaker";
import NewConversation from "./NewConversation";
import NotificationsScreen from "./NotificationsScreen";
import OnboardingScreen from "./Onboarding";
import ProfileScreen from "./Profile";
import ShareProfileScreen from "./ShareProfile";
import WebviewPreview from "./WebviewPreview";

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
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  Profile: {
    address: string;
  };
  WebviewPreview: {
    uri: string;
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
  const { state } = useContext(AppContext);

  const navigationState = useRef<any>(undefined);

  const mainHeaders = (
    <>
      <StatusBar
        hidden={false}
        backgroundColor={backgroundColor(colorScheme)}
        style={colorScheme === "dark" ? "light" : "dark"}
      />
      <HydrationStateHandler />
      <InitialStateHandler />
      <NetworkStateHandler />
      <MainIdentityStateHandler />
      <NotificationsStateHandler />
      <ActionSheetStateHandler />
    </>
  );

  let screenToShow = undefined;

  if (state.app.splashScreenHidden) {
    if (!state.xmtp.address) {
      screenToShow = <OnboardingScreen />;
    } else if (
      state.notifications.showNotificationsScreen &&
      (state.notifications.status === "undetermined" ||
        (state.notifications.status === "denied" && Platform.OS === "android"))
    ) {
      screenToShow = <NotificationsScreen />;
    } else {
      const linking = {
        prefixes: [prefix, ...config.universalLinks],
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
            WebviewPreview: {
              path: "/webviewPreview",
              parse: {
                uri: decodeURIComponent,
              },
              stringify: {
                uri: encodeURIComponent,
              },
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
      screenToShow = (
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
                headerStyle: {
                  backgroundColor: backgroundColor(colorScheme),
                },
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
                  headerStyle: {
                    backgroundColor:
                      navigationSecondaryBackgroundColor(colorScheme),
                  },
                }}
              />
              <Stack.Screen
                name="ConverseMatchMaker"
                component={ConverseMatchMaker}
                options={{
                  headerTitle: "Converse Match Maker",
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
              <Stack.Screen
                name="WebviewPreview"
                component={WebviewPreview}
                options={{
                  headerTitle: "File preview",
                  presentation: "modal",
                  headerStyle: {
                    backgroundColor:
                      navigationSecondaryBackgroundColor(colorScheme),
                  },
                }}
              />

              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  headerTitle: "Contact details",
                  headerTintColor:
                    Platform.OS === "android"
                      ? textSecondaryColor(colorScheme)
                      : undefined,
                }}
              />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>
      );
    }
  }

  return (
    <>
      {mainHeaders}
      {screenToShow}
      {state.app.mediaPreview.mediaURI && <ChatSendAttachment />}
    </>
  );
}
