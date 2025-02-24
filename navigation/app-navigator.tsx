import {
  ConversationNav,
  ConversationScreenConfig,
} from "@features/conversation/conversation.nav";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React, { useEffect } from "react";
import { config } from "@/config";
import { AppSettingsScreen } from "@/features/app-settings/app-settings.screen";
import { useAuthStore } from "@/features/authentication/authentication.store";
import { BlockedConversationsScreen } from "@/features/blocked-conversations/blocked-conversations.screen";
import { ConversationListScreen } from "@/features/conversation-list/conversation-list.screen";
import { ConversationRequestsListNav } from "@/features/conversation-requests-list/conversation-requests-list.nav";
import { OnboardingContactCardScreen } from "@/features/onboarding/screens/onboarding-contact-card-screen";
import { OnboardingWelcomeScreen } from "@/features/onboarding/screens/onboarding-welcome-screen";
import {
  ProfileNav,
  ProfileScreenConfig,
} from "@/features/profiles/profile.nav";
import { NavigationParamList } from "@/navigation/navigation.types";
import { navigationRef } from "@/navigation/navigation.utils";
import { WebviewPreviewNav } from "@/screens/WebviewPreviewNav";
import { useThemeProvider } from "@/theme/use-app-theme";
import { captureError } from "@/utils/capture-error";
import { useUpdateSentry } from "@/utils/sentry";
import { hideSplashScreen } from "@/utils/splash/splash";
import {
  ShareProfileNav,
  ShareProfileScreenConfig,
} from "../screens/ShareProfileNav";

const prefix = Linking.createURL("/");

const linking: LinkingOptions<NavigationParamList> = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: ConversationScreenConfig,
      Profile: ProfileScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
    },
  },
  // TODO: Fix this
  // getStateFromPath: getConverseStateFromPath("fullStackNavigation"),
  // TODO: Fix this
  // getInitialURL: () => null,
};

export function AppNavigator() {
  const {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider,
  } = useThemeProvider();

  useUpdateSentry();

  return (
    <>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
        <NavigationContainer<NavigationParamList>
          theme={navigationTheme}
          linking={linking}
          ref={navigationRef}
          onUnhandledAction={() => {
            // Since we're handling multiple navigators,
            // let's silence errors when the action
            // is not meant for this one
          }}
        >
          <AppStacks />
        </NavigationContainer>
      </ThemeProvider>
    </>
  );
}

export const AppNativeStack = createNativeStackNavigator<NavigationParamList>();

function AppStacks() {
  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    if (authStatus !== "undetermined") {
      hideSplashScreen().catch(captureError);
    }
  }, [authStatus]);

  const isUndetermined = authStatus === "undetermined";
  const isOnboarding = authStatus === "onboarding";
  const isSignedOut = authStatus === "signedOut";

  return (
    <AppNativeStack.Navigator
      screenOptions={{
        // Since we handle with useHeader hook
        header: () => null,
      }}
    >
      {isUndetermined ? (
        // Show idle screen during restoration
        <AppNativeStack.Screen
          name="Idle"
          component={IdleScreen}
          // Fade animation for auth state changes
          options={{ animation: "fade" }}
        />
      ) : isSignedOut ? (
        <AppNativeStack.Group>
          <AppNativeStack.Screen
            name="OnboardingWelcome"
            component={OnboardingWelcomeScreen}
            // Fade animation when transitioning to signed out state
            options={{ animation: "fade" }}
          />
        </AppNativeStack.Group>
      ) : isOnboarding ? (
        <AppNativeStack.Group>
          <AppNativeStack.Screen
            name="OnboardingCreateContactCard"
            component={OnboardingContactCardScreen}
            // Fade animation when transitioning to onboarding state
            options={{ animation: "fade" }}
          />
          {/* <NativeStack.Screen
            name="OnboardingNotifications"
            component={OnboardingNotificationsScreen}
          /> */}
        </AppNativeStack.Group>
      ) : (
        // Main app screens
        <AppNativeStack.Group>
          <AppNativeStack.Screen
            name="Chats"
            component={ConversationListScreen}
            // Fade animation when transitioning to authenticated state
            options={{ animation: "fade" }}
          />
          <AppNativeStack.Screen
            name="Blocked"
            component={BlockedConversationsScreen}
          />
          {ConversationRequestsListNav()}
          {ConversationNav()}
          {ShareProfileNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
          <AppNativeStack.Screen
            name="AppSettings"
            component={AppSettingsScreen}
          />
        </AppNativeStack.Group>
      )}
    </AppNativeStack.Navigator>
  );
}

// TODO: Maybe show animated splash screen or something
function IdleScreen() {
  return null;
}
