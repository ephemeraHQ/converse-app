import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { backgroundColor } from "@styles/colors";
import { getProfile } from "@utils/profile";
import { useCheckCurrentInstallation } from "@utils/xmtpRN/client";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef } from "react";
import { Dimensions, Platform, useColorScheme } from "react-native";

import ActionSheetStateHandler from "../components/StateHandlers/ActionSheetStateHandler";
import HydrationStateHandler from "../components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "../components/StateHandlers/InitialStateHandler";
import MainIdentityStateHandler from "../components/StateHandlers/MainIdentityStateHandler";
import NetworkStateHandler from "../components/StateHandlers/NetworkStateHandler";
import ConversationsStateHandler from "../components/StateHandlers/NotificationsStateHandler";
import WalletsStateHandler from "../components/StateHandlers/WalletsStateHandler";
import config from "../config";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { useSelect } from "../data/store/storeHelpers";
import { useAddressBookStateHandler } from "../utils/addressBook";
import { converseEventEmitter } from "../utils/events";
import { usePrivyAccessToken } from "../utils/evm/privy";
import { converseNavigations } from "../utils/navigation";
import AccountsAndroid from "./Accounts/AccountsAndroid";
import AccountsDrawer from "./Accounts/AccountsDrawer";
import { ConversationScreenConfig } from "./Navigation/ConversationNav";
import { GroupInviteScreenConfig } from "./Navigation/GroupInviteNav";
import { GroupLinkScreenConfig } from "./Navigation/GroupLinkNav";
import { GroupScreenConfig } from "./Navigation/GroupNav";
import MainNavigation, { NavigationParamList } from "./Navigation/Navigation";
import { NewConversationScreenConfig } from "./Navigation/NewConversationNav";
import { ProfileScreenConfig } from "./Navigation/ProfileNav";
import { ShareProfileScreenConfig } from "./Navigation/ShareProfileNav";
import SplitScreenNavigation from "./Navigation/SplitScreenNavigation/SplitScreenNavigation";
import { WebviewPreviewScreenConfig } from "./Navigation/WebviewPreviewNav";
import {
  getConverseInitialURL,
  getConverseStateFromPath,
  useIsSplitScreen,
} from "./Navigation/navHelpers";

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
    },
  },
  getStateFromPath: getConverseStateFromPath,
  getInitialURL: getConverseInitialURL,
};

export default function Main() {
  // Makes sure we have a Privy token ready to make API calls
  usePrivyAccessToken();
  useAddressBookStateHandler();
  useCheckCurrentInstallation();

  return (
    <>
      <Initializer />
      <NavigationContainer
        linking={linking}
        ref={(r) => {
          if (r) {
            converseNavigations["splitScreen"] = r;
          }
        }}
        onUnhandledAction={() => {
          // Since we're handling multiple navigators,
          // let's silence errors when the action
          // is not meant for this one
        }}
      >
        <NavigationContent />
      </NavigationContainer>
    </>
  );
}

const NavigationContent = () => {
  const colorScheme = useColorScheme();
  const isSplitScreen = useIsSplitScreen();

  const { splashScreenHidden } = useAppStore(
    useSelect(["notificationsPermissionStatus", "splashScreenHidden"])
  );

  const { navigationDrawer } = useNavigationDrawer();
  const { userAddress, addingNewAccount } = useUserStatus();

  const { resetOnboarding } = useOnboardingStore(
    useSelect(["resetOnboarding", "addingNewAccount"])
  );

  useEffect(() => {
    if (userAddress && !addingNewAccount) {
      resetOnboarding();
    }
  }, [addingNewAccount, resetOnboarding, userAddress]);

  if (!splashScreenHidden) {
    // TODO: Add a loading screen
    return null;
  }

  if (Platform.OS === "android") {
    return (
      <AccountsDrawer
        drawerBackgroundColor={backgroundColor(colorScheme)}
        ref={navigationDrawer}
        drawerWidth={Dimensions.get("screen").width * 0.77}
        renderNavigationView={() => <AccountsAndroid />}
      >
        <MainNavigation />
      </AccountsDrawer>
    );
  }

  if (isSplitScreen) {
    return <SplitScreenNavigation />;
  }

  return <MainNavigation />;
};

// Bunch of handlers. Not really react components
const Initializer = () => {
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === "web";
  const isAndroid = Platform.OS === "android";

  return (
    <>
      {!isWeb && (
        <>
          <HydrationStateHandler />
          <InitialStateHandler />
        </>
      )}
      {isAndroid && (
        <StatusBar backgroundColor={backgroundColor(colorScheme)} />
      )}
      <NetworkStateHandler />
      <MainIdentityStateHandler />
      <ConversationsStateHandler />
      <ActionSheetStateHandler />
      <WalletsStateHandler />
    </>
  );
};

const useNavigationDrawer = () => {
  const navigationDrawer = useRef<any>(null);

  const toggleNavigationDrawer = useCallback((open: boolean) => {
    if (open) {
      navigationDrawer.current?.openDrawer();
    } else {
      navigationDrawer.current?.closeDrawer();
    }
  }, []);

  useEffect(() => {
    converseEventEmitter.on("toggle-navigation-drawer", toggleNavigationDrawer);
    return () => {
      converseEventEmitter.off(
        "toggle-navigation-drawer",
        toggleNavigationDrawer
      );
    };
  }, [toggleNavigationDrawer]);

  return { navigationDrawer, toggleNavigationDrawer };
};

const useUserStatus = () => {
  const userAddress = useCurrentAccount();
  const socials = useProfilesStore((s) =>
    userAddress ? getProfile(userAddress, s.profiles)?.socials : undefined
  );
  const currentUserName = socials?.userNames?.find((e) => e.isPrimary);
  const { resetOnboarding, addingNewAccount } = useOnboardingStore(
    useSelect(["resetOnboarding", "addingNewAccount"])
  );

  useEffect(() => {
    if (userAddress && !addingNewAccount) {
      resetOnboarding();
    }
  }, [addingNewAccount, resetOnboarding, userAddress]);

  return { userAddress, currentUserName, addingNewAccount };
};
