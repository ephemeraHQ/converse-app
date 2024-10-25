import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React, { memo } from "react";

import ExternalWalletPicker from "../components/ExternalWalletPicker";
import config from "../config";
import { GroupInviteScreenConfig } from "./Navigation/GroupInviteNav";
import { NavigationParamList } from "./Navigation.types";
import { OnboardingUserProfileScreen } from "../screens/Onboarding/OnboardingUserProfileScreen";
import { useThemeProvider } from "../theme/useAppTheme";
import { ConversationListScreen } from "../screens/ConversationListScreen";
import { ConversationScreenConfig } from "./Navigation/ConversationNav";
import ConversationRequestsListNav from "./Navigation/ConversationRequestsListNav.ios";
import { GroupLinkScreenConfig } from "./Navigation/GroupLinkNav";
import { GroupScreenConfig } from "./Navigation/GroupNav";
import { NewConversationScreenConfig } from "./Navigation/NewConversationNav";
import { ProfileScreenConfig } from "./Navigation/ProfileNav";
import { ShareProfileScreenConfig } from "./Navigation/ShareProfileNav";
import { WebviewPreviewScreenConfig } from "./Navigation/WebviewPreviewNav";
import { NewAccountNavigator } from "./NewAccountNavigator";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
  navigationRef,
  screenListeners,
} from "./navHelpers";
import { useAuthStatus } from "../data/store/authStore";
import { OnboardingConnectWalletScreen } from "../screens/Onboarding/OnboardingConnectWalletScreen";
import { OnboardingEphemeraScreen } from "../screens/Onboarding/OnboardingEphemeraScreen";
import { OnboardingGetStartedScreen } from "../screens/Onboarding/OnboardingGetStartedScreen";
import { OnboardingNotificationsScreen } from "../screens/Onboarding/OnboardingNotificationsScreen";
import { OnboardingPrivateKeyScreen } from "../screens/Onboarding/OnboardingPrivateKeyScreen";
import { OnboardingPrivyScreen } from "../screens/Onboarding/OnboardingPrivyScreen";

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
  const authStatus = useAuthStatus();

  if (authStatus === "idle") {
    return null;
  }

  return (
    <Stack.Navigator screenListeners={screenListeners}>
      {/* {authStatus === "idle" ? (
        <Stack.Screen name="Idle" component={IdleScreen} />
      ) : */}
      authStatus === "signedOut" ? (
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
          <Stack.Screen name="Chats" component={ConversationListScreen} />
          <Stack.Screen
            name="ChatsRequests"
            component={ConversationRequestsListNav}
          />
          <Stack.Screen name="Blocked" component={ConversationBlockedListNav} />
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
          />
        </Stack.Group>

        {/* New account */}
        <Stack.Screen name="NewAccount" component={NewAccountNavigator} />
      </>
    </Stack.Navigator>
  );
});
