import { config } from "@/config";
import { ProfileScreenConfig } from "@/features/profiles/profile.nav";
import ActionSheetStateHandler from "@components/StateHandlers/ActionSheetStateHandler";
import { HydrationStateHandler } from "@components/StateHandlers/HydrationStateHandler";
import { InitialStateHandler } from "@components/StateHandlers/InitialStateHandler";
import NetworkStateHandler from "@components/StateHandlers/NetworkStateHandler";
import { ConversationScreenConfig } from "@features/conversation/conversation.nav";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { backgroundColor } from "@styles/colors";
import { useThemeProvider } from "@theme/useAppTheme";
import { converseNavigatorRef } from "@utils/navigation";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, useColorScheme } from "react-native";
import {
  IdleNavigation,
  NavigationParamList,
  SignedInNavigation,
  SignedOutNavigation,
} from "./Navigation/Navigation";
import { ShareProfileScreenConfig } from "./Navigation/ShareProfileNav";
import { WebviewPreviewScreenConfig } from "./Navigation/WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
} from "./Navigation/navHelpers";
import { useAuthStatus } from "@/features/authentication/useAuthStatus.hook";
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
      WebviewPreview: WebviewPreviewScreenConfig,
    },
  },
  // @ts-ignore
  getStateFromPath: getConverseStateFromPath("fullStackNavigation"),
  getInitialURL: getConverseInitialURL,
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
        <Initializer />
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
  const { isRestoring, isSignedIn, isSignedOut } = useAuthStatus();

  // Show idle navigation during signup/signin/restoration
  if (isRestoring) {
    return <IdleNavigation />;
  } else if (isSignedOut) {
    return <SignedOutNavigation />;
  } else if (isSignedIn) {
    return <SignedInNavigation />;
  }
};

// Bunch of handlers. Not really react components
const Initializer = () => {
  const colorScheme = useColorScheme();

  return (
    <>
      <HydrationStateHandler />
      <InitialStateHandler />
      {Platform.OS === "android" && (
        <StatusBar backgroundColor={backgroundColor(colorScheme)} />
      )}
      <NetworkStateHandler />
      <ActionSheetStateHandler />
    </>
  );
};
