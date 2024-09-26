import { backgroundColor } from "@styles/colors";
import { getProfile } from "@utils/profile";
import { useCheckCurrentInstallation } from "@utils/xmtpRN/client";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef } from "react";
import { Dimensions, Platform, useColorScheme } from "react-native";

import AccountsAndroid from "./Accounts/AccountsAndroid";
import AccountsDrawer from "./Accounts/AccountsDrawer";
import Navigation from "./Navigation/Navigation";
import SplitScreenNavigation from "./Navigation/SplitScreenNavigation/SplitScreenNavigation";
import { useIsSplitScreen } from "./Navigation/navHelpers";
import ActionSheetStateHandler from "../components/StateHandlers/ActionSheetStateHandler";
import HydrationStateHandler from "../components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "../components/StateHandlers/InitialStateHandler";
import MainIdentityStateHandler from "../components/StateHandlers/MainIdentityStateHandler";
import NetworkStateHandler from "../components/StateHandlers/NetworkStateHandler";
import ConversationsStateHandler from "../components/StateHandlers/NotificationsStateHandler";
import WalletsStateHandler from "../components/StateHandlers/WalletsStateHandler";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { useSelect } from "../data/store/storeHelpers";
import AuthNavigation from "../navigation/AuthNavigation";
import NavigationContainer from "../navigation/NavigationContainer";
import NewAccountNavigation from "../navigation/NewAccountNavigation";
import { useAddressBookStateHandler } from "../utils/addressBook";
import { converseEventEmitter } from "../utils/events";
import { usePrivyAccessToken } from "../utils/evm/privy";

export default function Main() {
  // Makes sure we have a Privy token ready to make API calls
  usePrivyAccessToken();
  useAddressBookStateHandler();
  useCheckCurrentInstallation();

  return (
    <>
      <Header />
      <NavigationContainer>
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

  if (!userAddress) {
    return <AuthNavigation />;
  }

  // TODO: Should not be here
  if (addingNewAccount) {
    return <NewAccountNavigation />;
  }

  if (Platform.OS === "android") {
    return (
      <AccountsDrawer
        drawerBackgroundColor={backgroundColor(colorScheme)}
        ref={navigationDrawer}
        drawerWidth={Dimensions.get("screen").width * 0.77}
        renderNavigationView={() => <AccountsAndroid />}
      >
        <Navigation />
      </AccountsDrawer>
    );
  }

  if (isSplitScreen) {
    return <SplitScreenNavigation />;
  }

  return <Navigation />;
};

const Header = () => {
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
