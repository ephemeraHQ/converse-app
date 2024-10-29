import {
  LinkingOptions,
  NavigationContainer,
  StackActions,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React, { memo } from "react";

import ExternalWalletPicker from "../components/ExternalWalletPicker";
import config from "../config";
import { NewAccountNavigator } from "./NewAccountNavigator";
import { useAuthStatus } from "../data/store/authStore";
import ConversationList from "../features/Conversation/ConversationList/ConversationList.screen";
import { ConversationScreenConfig } from "../screens/Navigation/ConversationNav";
import { GroupInviteScreenConfig } from "../screens/Navigation/GroupInviteNav";
import { GroupLinkScreenConfig } from "../screens/Navigation/GroupLinkNav";
import { GroupScreenConfig } from "../screens/Navigation/GroupNav";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { NewConversationScreenConfig } from "../screens/Navigation/NewConversationNav";
import { ProfileScreenConfig } from "../screens/Navigation/ProfileNav";
import { ShareProfileScreenConfig } from "../screens/Navigation/ShareProfileNav";
import { WebviewPreviewScreenConfig } from "../screens/Navigation/WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
  navigationRef,
} from "../screens/Navigation/navHelpers";
import { OnboardingConnectWalletScreen } from "../screens/Onboarding/OnboardingConnectWalletScreen";
import { OnboardingEphemeraScreen } from "../screens/Onboarding/OnboardingEphemeraScreen";
import { OnboardingGetStartedScreen } from "../screens/Onboarding/OnboardingGetStartedScreen";
import { OnboardingNotificationsScreen } from "../screens/Onboarding/OnboardingNotificationsScreen";
import { OnboardingPrivateKeyScreen } from "../screens/Onboarding/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../screens/Onboarding/OnboardingPrivyScreen";
import { OnboardingUserProfileScreen } from "../screens/Onboarding/OnboardingUserProfileScreen";
import { useAppTheme, useThemeProvider } from "../theme/useAppTheme";
import { converseEventEmitter } from "../utils/events";

const prefix = Linking.createURL("/");

const linking: LinkingOptions<NavigationParamList> = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: ConversationScreenConfig,
      NewConversation: NewConversationScreenConfig,
      Profile: ProfileScreenConfig,
      Group: GroupScreenConfig,
      GroupLink: GroupLinkScreenConfig,
      GroupInvite: GroupInviteScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
      WebviewPreview: WebviewPreviewScreenConfig,
      NewAccount: {
        screens: {},
      },
    },
  },
  getStateFromPath: getConverseStateFromPath,
  getInitialURL: getConverseInitialURL,
};

export function AppNavigator() {
  const {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider,
  } = useThemeProvider();

  return (
    <>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
        <NavigationContainer
          theme={navigationTheme}
          linking={linking}
          ref={navigationRef}
        >
          <AppStack />
        </NavigationContainer>
        {/* TODO: this should be closer to where it's used maybe?  */}
        <ExternalWalletPicker />
      </ThemeProvider>
    </>
  );
}

const Stack = createNativeStackNavigator<NavigationParamList>();

const AppStack = memo(() => {
  const { theme } = useAppTheme();

  const authStatus = useAuthStatus();

  if (authStatus === "idle") {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: theme.colors.background.raised,
        contentStyle: {
          backgroundColor: theme.colors.background.raised,
        },
      }}
      screenListeners={{
        // This function handles navigation state changes and deep linking
        state: (e) => {
          const oldRoutes = navigationRef.current?.getRootState()?.routes || [];
          const newRoutes = e.data?.state?.routes || [];

          console.log("newRoutes:", newRoutes);

          // Only proceed if there are routes to compare
          if (oldRoutes.length > 0 && newRoutes.length > 0) {
            const currentRoute = oldRoutes[oldRoutes.length - 1];
            const newRoute = newRoutes[newRoutes.length - 1];

            // Check if we're on the same screen but with different parameters
            if (
              currentRoute.key === newRoute.key &&
              currentRoute.name === newRoute.name
            ) {
              let shouldReplace = false;

              // Handle "NewConversation" screen
              if (
                newRoute.name === "NewConversation" &&
                newRoute.params?.peer &&
                currentRoute.params?.peer !== newRoute.params?.peer
              ) {
                shouldReplace = true;
              }
              // Handle "Conversation" screen
              else if (newRoute.name === "Conversation") {
                const isNewPeer =
                  newRoute.params?.mainConversationWithPeer &&
                  newRoute.params?.mainConversationWithPeer !==
                    currentRoute.params?.mainConversationWithPeer;
                const isNewTopic =
                  newRoute.params?.topic &&
                  newRoute.params?.topic !== currentRoute.params?.topic;

                if (isNewPeer || isNewTopic) {
                  shouldReplace = true;
                } else if (newRoute.params?.message) {
                  // Set input value if there's a message parameter
                  converseEventEmitter.emit(
                    "setCurrentConversationInputValue",
                    newRoute.params.message
                  );
                }
              }

              // Replace the current route if needed
              if (shouldReplace) {
                navigationRef.current?.dispatch(
                  StackActions.replace(newRoute.name, newRoute.params)
                );
              }
            }
          }
        },
      }}
    >
      {authStatus === "signedOut" ? (
        <Stack.Group>
          <Stack.Screen
            name="OnboardingGetStarted"
            component={OnboardingGetStartedScreen}
          />
          <Stack.Screen
            name="OnboardingPrivy"
            component={OnboardingPrivyScreen}
          />
          <Stack.Screen
            name="OnboardingConnectWallet"
            component={OnboardingConnectWalletScreen}
          />
          <Stack.Screen
            name="OnboardingNotifications"
            component={OnboardingNotificationsScreen}
          />
          <Stack.Screen
            name="OnboardingUserProfile"
            component={OnboardingUserProfileScreen}
          />
          <Stack.Screen
            name="OnboardingPrivateKey"
            component={OnboardingPrivateKeyScreen}
          />
          <Stack.Screen
            name="OnboardingEphemeral"
            component={OnboardingEphemeraScreen}
          />
        </Stack.Group>
      ) : (
        <>
          {/* Main */}
          <Stack.Group>
            <Stack.Screen name="Chats" component={ConversationList} />
            {/* <Stack.Screen
              name="ChatsRequests"
              component={ConversationRequestsListNav}
            />
            <Stack.Screen
              name="Blocked"
              component={ConversationBlockedListNav}
            />
            <Stack.Screen name="Conversation" component={ConversationNav} />
            <Stack.Screen
              name="NewConversation"
              component={NewConversationScreen}
              options={NewConversationScreenOptions}
            />
            <Stack.Screen
              name="ConverseMatchMaker"
              component={ConverseMatchMakerScreen}
              options={ConverseMatchMakerScreenOptions}
            />
            <Stack.Screen
              name="ShareProfile"
              component={ShareProfileScreen}
              options={ShareProfileScreenOptions}
            />
            <Stack.Screen
              name="ShareFrame"
              component={ShareFrameScreen}
              options={ShareFrameScreenOptions}
            />
            <Stack.Screen
              name="WebviewPreview"
              component={WebviewPreviewScreen}
              options={WebviewPreviewScreenOptions}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={ProfileScreenOptions}
            />
            <Stack.Screen
              name="Group"
              component={GroupScreen}
              options={GroupScreenOptions}
            />
            <Stack.Screen
              name="GroupLink"
              component={GroupLinkScreen}
              options={GroupLinkScreenOptions}
            />
            <Stack.Screen
              name="GroupInvite"
              component={GroupInviteScreen}
              options={GroupInviteScreenOptions}
            />
            <Stack.Screen
              name="TopUp"
              component={TopUpScreen}
              options={TopUpScreenOptions}
            /> */}
          </Stack.Group>

          {/* New account */}
          <Stack.Screen name="NewAccount" component={NewAccountNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
});
