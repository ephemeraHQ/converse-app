import { TransactionPreview } from "@components/TransactionPreview/TransactionPreview";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { backgroundColor } from "@styles/colors";
import { useCheckCurrentInstallation } from "@utils/xmtpRN/client";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, useColorScheme } from "react-native";

import ActionSheetStateHandler from "../components/StateHandlers/ActionSheetStateHandler";
import HydrationStateHandler from "../components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "../components/StateHandlers/InitialStateHandler";
import MainIdentityStateHandler from "../components/StateHandlers/MainIdentityStateHandler";
import NetworkStateHandler from "../components/StateHandlers/NetworkStateHandler";
import WalletsStateHandler from "../components/StateHandlers/WalletsStateHandler";
import config from "../config";
import { useAppStore } from "../data/store/appStore";
import { useAuthStatus } from "../data/store/authStore";
import { useSelect } from "../data/store/storeHelpers";
import { useThemeProvider } from "../theme/useAppTheme";
import { useAutoConnectExternalWallet } from "../utils/evm/external";
import { usePrivyAccessToken } from "../utils/evm/privy";
import { setConverseNavigatorRef } from "../utils/navigation";
import { ConversationScreenConfig } from "../features/conversation/conversation.nav";
import { GroupScreenConfig } from "./Navigation/GroupNav";
import {
  IdleNavigation,
  NavigationParamList,
  SignedInNavigation,
  SignedOutNavigation,
} from "./Navigation/Navigation";
import { ProfileScreenConfig } from "./Navigation/ProfileNav";
import { ShareProfileScreenConfig } from "./Navigation/ShareProfileNav";
import { WebviewPreviewScreenConfig } from "./Navigation/WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
} from "./Navigation/navHelpers";
import { JoinGroupScreenConfig } from "@/features/GroupInvites/joinGroup/JoinGroupNavigation";
import logger from "@/utils/logger";
import { CreateConversationScreenConfig } from "@/features/create-conversation/create-conversation.nav";

const prefix = Linking.createURL("/");

const linking: LinkingOptions<NavigationParamList> = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: ConversationScreenConfig,
      CreateConversation: CreateConversationScreenConfig,
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

export default function Main() {
  // Makes sure we have a Privy token ready to make API calls
  usePrivyAccessToken();
  useCheckCurrentInstallation();
  useAutoConnectExternalWallet();

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
        <NavigationContainer
          theme={navigationTheme}
          linking={linking}
          ref={(r) => {
            logger.info(
              `[Main] Setting navigation ref to ${r ? "not null" : "null"}`
            );
            setConverseNavigatorRef(r);
          }}
          onUnhandledAction={() => {
            // Since we're handling multiple navigators,
            // let's silence errors when the action
            // is not meant for this one
          }}
        >
          <NavigationContent />
        </NavigationContainer>
        <TransactionPreview />
      </ThemeProvider>
    </>
  );
}

const NavigationContent = () => {
  const authStatus = useAuthStatus();

  const { splashScreenHidden } = useAppStore(useSelect(["splashScreenHidden"]));

  // Uncomment to test design system components
  // return (
  //   <NativeStack.Navigator>
  //     <NativeStack.Screen name="Examples" component={Examples} />
  //   </NativeStack.Navigator>
  // );

  if (!splashScreenHidden) {
    // TODO: Add a loading screen
    return null;
  }

  if (authStatus === "idle") {
    return <IdleNavigation />;
  }

  if (authStatus === "signedOut") {
    return <SignedOutNavigation />;
  }

  return <SignedInNavigation />;
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
      <MainIdentityStateHandler />
      <ActionSheetStateHandler />
      <WalletsStateHandler />
    </>
  );
};
