import { config } from "@/config";
import { JoinGroupScreenConfig } from "@/features/GroupInvites/joinGroup/JoinGroupNavigation";
import { ProfileScreenConfig } from "@/features/profiles/profile.nav";
import { useCheckCurrentInstallation } from "@/utils/xmtpRN/xmtp-client/xmtp-client-installations";
import ActionSheetStateHandler from "@components/StateHandlers/ActionSheetStateHandler";
import { HydrationStateHandler } from "@components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "@components/StateHandlers/InitialStateHandler";
import NetworkStateHandler from "@components/StateHandlers/NetworkStateHandler";
import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import { ConversationScreenConfig } from "@features/conversation/conversation.nav";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { backgroundColor } from "@styles/colors";
import { useThemeProvider } from "@theme/useAppTheme";
import { converseNavigatorRef } from "@utils/navigation";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { GroupScreenConfig } from "./Navigation/GroupNav";
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
import {
  useEmbeddedEthereumWallet,
  usePrivy,
  usePrivyClient,
} from "@privy-io/expo";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import logger from "@/utils/logger";
import { useActorRef } from "@xstate/react";
const prefix = Linking.createURL("/");

const linking: LinkingOptions<NavigationParamList> = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
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

export default function Main() {
  useCheckCurrentInstallation();

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

export function useIsXmtpInitialized() {
  const { user, isReady } = usePrivy();

  const { client: privySmartWalletClient } = useSmartWallets();

  // logger.debug(
  //   `[useIsXmtpInitialized] Initial state - user: ${!!user}, privySmartWalletClient: ${!!privySmartWalletClient}, isReady: ${isReady}`
  // );

  const [isXmtpInitialized, setIsXmtpInitialized] = useState(
    MultiInboxClient.instance.isInitialized
  );

  // logger.debug(
  //   `[useIsXmtpInitialized] Initial isXmtpInitialized state: ${isXmtpInitialized}`
  // );

  useEffect(() => {
    // logger.debug("[useIsXmtpInitialized] Setting up XMTP initialized observer");
    const unsubscribe = MultiInboxClient.instance.addXmtpInitializedObserver(
      () => {
        // logger.debug("[useIsXmtpInitialized] XMTP initialized, updating state");
        setIsXmtpInitialized(true);
      }
    );
    return () => {
      // logger.debug(
      //   "[useIsXmtpInitialized] Cleaning up XMTP initialized observer"
      // );
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function initializeXmtp() {
      try {
        if (!isReady) {
          // logger.debug(
          //   "[useIsXmtpInitialized] Privy not ready yet, waiting..."
          // );
          return;
        }

        if (!user) {
          // logger.debug(
          //   "[useIsXmtpInitialized] No user, skipping initialization"
          // );
          return;
        }

        // logger.debug(
        //   `[useIsXmtpInitialized] Initializing XMTP with privySmartWalletClient: ${!!privySmartWalletClient}`
        // );

        await MultiInboxClient.instance.initialize({
          privySmartWalletClient,
        });

        // logger.debug("[useIsXmtpInitialized] XMTP initialization completed");
      } catch (error) {
        // logger.error("[useIsXmtpInitialized] Error initializing XMTP:", error);
        // We might want to handle this error more gracefully in the UI
      }
    }

    initializeXmtp();
  }, [privySmartWalletClient, isReady, user]);

  return {
    isXmtpInitialized,
  };
}

const NavigationContent = () => {
  const { user, isReady } = usePrivy();
  const isSignedInPrivy = isReady && user;
  const { isXmtpInitialized } = useIsXmtpInitialized();
  const currentSender = MultiInboxClient.instance.getCurrentSender();

  // logger.debug(
  //   `[NavigationContent] State - isReady: ${isReady}, isXmtpInitialized: ${isXmtpInitialized}, user: ${!!user}, currentSender: ${!!currentSender}`
  // );

  // User is signed out if they're ready but not signed in to Privy
  const isSignedOut = (isReady && !isSignedInPrivy) || !currentSender;

  // User is in idle state if they're not ready OR XMTP isn't initialized
  const isIdle = !isReady;

  // User is fully signed in if:
  // 1. Privy is ready
  // 2. User is signed into Privy
  // 3. XMTP is initialized
  // 4. We have a current sender
  const isSignedIn =
    isReady && isSignedInPrivy && isXmtpInitialized && !!currentSender;

  // logger.debug(
  //   `[NavigationContent] Navigation state - isIdle: ${isIdle}, isSignedOut: ${isSignedOut}, isSignedIn: ${isSignedIn}`
  // );

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

  if (isIdle) {
    return <IdleNavigation />;
  }
  if (isSignedOut) {
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
      <ActionSheetStateHandler />
    </>
  );
};
