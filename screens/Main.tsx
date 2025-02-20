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
import { IdleScreen } from "@/screens/IdleScreen";
import {
  NativeStack,
  NavigationParamList,
} from "@/screens/Navigation/Navigation";
import { captureError } from "@/utils/capture-error";
import { hideSplashScreen } from "@/utils/splash/splash";
import {
  ConversationNav,
  ConversationScreenConfig,
} from "@features/conversation/conversation.nav";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { useThemeProvider } from "@theme/useAppTheme";
import { converseNavigatorRef } from "@utils/navigation";
import * as Linking from "expo-linking";
import React, { useEffect } from "react";
import {
  ShareProfileNav,
  ShareProfileScreenConfig,
} from "./Navigation/ShareProfileNav";

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

export function Main() {
  const {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider,
  } = useThemeProvider();

  return (
    <>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
        <NavigationContainer<NavigationParamList>
          theme={navigationTheme}
          linking={linking}
          ref={converseNavigatorRef}
          onUnhandledAction={() => {
            // Since we're handling multiple navigators,
            // let's silence errors when the action
            // is not meant for this one
          }}
        >
          <NavigationContent />
        </NavigationContainer>
      </ThemeProvider>
    </>
  );
}

const NavigationContent = () => {
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
    <NativeStack.Navigator
      screenOptions={{
        // Since we handle with useHeader hook
        header: () => null,
      }}
    >
      {isUndetermined ? (
        // Show idle screen during restoration
        <NativeStack.Screen
          name="Idle"
          component={IdleScreen}
          // Fade animation for auth state changes
          options={{ animation: "fade" }}
        />
      ) : isSignedOut ? (
        <NativeStack.Group>
          <NativeStack.Screen
            name="OnboardingWelcome"
            component={OnboardingWelcomeScreen}
            // Fade animation when transitioning to signed out state
            options={{ animation: "fade" }}
          />
        </NativeStack.Group>
      ) : isOnboarding ? (
        <NativeStack.Group>
          <NativeStack.Screen
            name="OnboardingCreateContactCard"
            component={OnboardingContactCardScreen}
            // Fade animation when transitioning to onboarding state
            options={{ animation: "fade" }}
          />
          {/* <NativeStack.Screen
            name="OnboardingNotifications"
            component={OnboardingNotificationsScreen}
          /> */}
        </NativeStack.Group>
      ) : (
        // Main app screens
        <NativeStack.Group>
          <NativeStack.Screen
            name="Chats"
            component={ConversationListScreen}
            // Fade animation when transitioning to authenticated state
            options={{ animation: "fade" }}
          />
          <NativeStack.Screen
            name="Blocked"
            component={BlockedConversationsScreen}
          />
          {ConversationRequestsListNav()}
          {ConversationNav()}
          {ShareProfileNav()}
          {/* {WebviewPreviewNav()} */}
          {ProfileNav()}
          <NativeStack.Screen
            name="AppSettings"
            component={AppSettingsScreen}
          />
        </NativeStack.Group>
      )}
    </NativeStack.Navigator>
  );
};
