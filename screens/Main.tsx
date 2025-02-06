import { config } from "@/config";
import { JoinGroupScreenConfig } from "@/features/GroupInvites/joinGroup/JoinGroupNavigation";
import { ProfileScreenConfig } from "@/features/profiles/profile.nav";
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
import React, { useEffect } from "react";
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
import { usePrivy } from "@privy-io/expo";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { MultiInboxClientRestorationStates } from "@/features/multi-inbox/multi-inbox-client.types";
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

export function useHasMultiInboxClientRestored() {
  const { user, isReady } = usePrivy();

  useEffect(() => {
    async function restoreXmtp() {
      try {
        if (!isReady) {
          // logger.debug(
          //   "[useHasMultiInboxClientRestored] Privy not ready yet, waiting..."
          // );
          return;
        }

        if (!user) {
          // logger.debug(
          //   "[useHasMultiInboxClientRestored] No user, skipping initialization"
          // );
          return;
        }

        // logger.debug(
        //   `[useHasMultiInboxClientRestored] Initializing XMTP with privySmartWalletClient: ${!!privySmartWalletClient}`
        // );

        await MultiInboxClient.instance.restorePreviouslyCreatedInboxesForDevice();

        // logger.debug("[useHasMultiInboxClientRestored] XMTP initialization completed");
      } catch (error) {
        // logger.error("[useHasMultiInboxClientRestored] Error initializing XMTP:", error);
        // We might want to handle this error more gracefully in the UI
      }
    }

    restoreXmtp();
  }, [isReady, user]);

  const hasMultiInboxClientRestored = useAccountsStore(
    (state) =>
      state.multiInboxClientRestorationState ===
      MultiInboxClientRestorationStates.restored
  );

  return {
    hasMultiInboxClientRestored,
  };
}

const NavigationContent = () => {
  const authStatus = useAccountsStore((state) => state.authStatus);
  const isCheckingAuth = authStatus === AuthStatuses.checking;
  const isSignedIn = authStatus === AuthStatuses.signedIn;
  const isSignedOut = authStatus === AuthStatuses.signedOut;

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

  if (isCheckingAuth) {
    return <IdleNavigation />;
  } else if (isSignedOut) {
    return <SignedOutNavigation />;
  } else if (isSignedIn) {
    return <SignedInNavigation />;
  } else {
    throw new Error(`Invalid auth status: ${authStatus}`);
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
