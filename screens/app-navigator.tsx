import { config } from "@/config";
import { JoinGroupScreenConfig } from "@/features/GroupInvites/joinGroup/JoinGroupNavigation";
import { useAuthStore } from "@/features/authentication/auth.store";
import { hydrateAuth } from "@/features/authentication/hydrate-auth";
import { ConversationListScreen } from "@/features/conversation-list/conversation-list.screen";
import { OnboardingWelcomeScreen } from "@/features/onboarding/screens/onboarding-welcome-screen";
import { ProfileScreenConfig } from "@/features/profiles/profile.nav";
import { setupStreamingSubscriptions } from "@/features/streams/streams";
import { IdleScreen } from "@/screens/IdleScreen";
import { setupAppAttest } from "@/utils/appCheck";
import { captureError } from "@/utils/capture-error";
import { useCoinbaseWalletListener } from "@/utils/coinbaseWallet";
import { hideSplashScreen } from "@/utils/splash/splash";
import { InitialStateHandler } from "@components/StateHandlers/InitialStateHandler";
import { ConversationScreenConfig } from "@features/conversation/conversation.nav";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { backgroundColor } from "@styles/colors";
import { useThemeProvider } from "@theme/useAppTheme";
import { converseNavigatorRef } from "@utils/navigation";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { GroupScreenConfig } from "./Navigation/GroupNav";
import { NativeStack, NavigationParamList } from "./Navigation/Navigation";
import { ShareProfileScreenConfig } from "./Navigation/ShareProfileNav";
import { WebviewPreviewScreenConfig } from "./Navigation/WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
} from "./Navigation/navHelpers";
const prefix = Linking.createURL("/");

const linking: LinkingOptions<NavigationParamList> = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "ConversationsList",
    screens: {
      ConversationsList: "/",
      Conversation: ConversationScreenConfig,
      Profile: ProfileScreenConfig,
      Group: GroupScreenConfig,
      GroupInvite: JoinGroupScreenConfig,
      ShareProfile: ShareProfileScreenConfig,
      WebviewPreview: WebviewPreviewScreenConfig,
    },
  },
  // @ts-ignore
  getStateFromPath: getConverseStateFromPath("fullStackNavigation"),
  getInitialURL: getConverseInitialURL,
};

export function AppNavigator() {
  const {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider,
  } = useThemeProvider();

  useEffect(() => {
    setupAppAttest();
    setupStreamingSubscriptions();
    hydrateAuth();
  }, []);

  const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);
  useCoinbaseWalletListener(true, coinbaseUrl);

  return (
    <>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
        {/* <Initializer /> */}
        <NavigationContainer<NavigationParamList>
          theme={navigationTheme}
          linking={linking}
          ref={converseNavigatorRef}
        >
          <AppStack />
        </NavigationContainer>
      </ThemeProvider>
    </>
  );
}

const AppStack = () => {
  // const { isRestoring, isSignedIn, isSignedOut } = useAuthStatus();

  const authStatus = useAuthStore((state) => state.status);

  // Hide splash screen when auth status is determined
  useEffect(() => {
    if (authStatus === "undetermined") {
      return;
    }

    hideSplashScreen().catch(captureError);
  }, [authStatus]);

  const isUndetermined = authStatus === "undetermined";
  const isSignedIn = authStatus === "signedIn";
  const isSignedOut = authStatus === "signedOut";

  return (
    <NativeStack.Navigator>
      {isUndetermined && (
        <NativeStack.Screen name="Idle" component={IdleScreen} />
      )}

      {isSignedIn && (
        // Signed in
        <NativeStack.Group>
          <NativeStack.Screen
            name="ConversationsList"
            component={ConversationListScreen}
          />
        </NativeStack.Group>
      )}

      {isSignedOut && (
        // Signed out
        <NativeStack.Group>
          <NativeStack.Screen
            options={{
              headerShown: false,
            }}
            name="OnboardingWelcome"
            component={OnboardingWelcomeScreen}
          />
        </NativeStack.Group>
      )}
    </NativeStack.Navigator>
  );
};

// Bunch of handlers. Not really react components
const Initializer = () => {
  const colorScheme = useColorScheme();

  return (
    <>
      <InitialStateHandler />
      {Platform.OS === "android" && (
        <StatusBar backgroundColor={backgroundColor(colorScheme)} />
      )}
    </>
  );
};
