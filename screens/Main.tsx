import ExternalWalletPicker from "@components/ExternalWalletPicker";
import UserProfile from "@components/Onboarding/UserProfile";
import { TransactionPreview } from "@components/TransactionPreview";
import { backgroundColor } from "@styles/colors";
import { useAutoConnectExternalWallet } from "@utils/evm/external";
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
import NotificationsScreen from "./NotificationsScreen";
import Onboarding from "./Onboarding";
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
  useSettingsStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { useSelect } from "../data/store/storeHelpers";
import { useAddressBookStateHandler } from "../utils/addressBook";
import { converseEventEmitter } from "../utils/events";
import { usePrivyAccessToken } from "../utils/evm/privy";

export default function Main() {
  // Makes sure we have a Privy token ready to make API calls
  usePrivyAccessToken();
  useAddressBookStateHandler();
  useCheckCurrentInstallation();
  useAutoConnectExternalWallet();
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount();
  const socials = useProfilesStore((s) =>
    userAddress ? getProfile(userAddress, s.profiles)?.socials : undefined
  );
  const currentUserName = socials?.userNames?.find((e) => e.isPrimary);
  // const currentFarcaster = socials?.farcasterUsernames?.find(
  //   (e) => e.linkedAccount
  // );
  const isSplitScreen = useIsSplitScreen();

  const { resetOnboarding, addingNewAccount } = useOnboardingStore(
    useSelect(["resetOnboarding", "addingNewAccount"])
  );
  // Once the user is fully connected, let's remove the Desktop Connect session id
  useEffect(() => {
    if (userAddress && !addingNewAccount) {
      resetOnboarding();
    }
  }, [addingNewAccount, resetOnboarding, userAddress]);

  const { notifications } = useSettingsStore(useSelect(["notifications"]));
  const { notificationsPermissionStatus, splashScreenHidden } = useAppStore(
    useSelect(["notificationsPermissionStatus", "splashScreenHidden"])
  );
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

  const mainHeaders = (
    <>
      {Platform.OS !== "web" && (
        <>
          <HydrationStateHandler />
          <InitialStateHandler />
        </>
      )}
      {Platform.OS === "android" && (
        <StatusBar backgroundColor={backgroundColor(colorScheme)} />
      )}
      <NetworkStateHandler />
      <MainIdentityStateHandler />
      <ConversationsStateHandler />
      <ActionSheetStateHandler />
      <WalletsStateHandler />
    </>
  );

  let screenToShow = undefined;

  if (splashScreenHidden) {
    if (!userAddress || addingNewAccount) {
      screenToShow = <Onboarding />;
    }
    // else if (!currentFarcaster && !skipFarcaster) {
    //   return <WarpcastConnect />;
    // } else if (
    //   Platform.OS !== "web" &&
    //   addressBookPermissionStatus === "undetermined" &&
    //   !skipAddressBook
    // ) {
    //   return <AddressBook />;
    // }
    else if (
      notifications.showNotificationScreen &&
      Platform.OS !== "web" &&
      (notificationsPermissionStatus === "undetermined" ||
        (notificationsPermissionStatus === "denied" &&
          Platform.OS === "android"))
    ) {
      screenToShow = <NotificationsScreen />;
    } else if (!currentUserName?.name) {
      screenToShow = <UserProfile onboarding />;
    } else if (Platform.OS === "android") {
      // On Android the whole navigation is wrapped in a drawler
      // layout to be able to display the menu
      screenToShow = (
        <AccountsDrawer
          drawerBackgroundColor={backgroundColor(colorScheme)}
          ref={navigationDrawer}
          drawerWidth={Dimensions.get("screen").width * 0.77}
          renderNavigationView={() => <AccountsAndroid />}
        >
          <Navigation />
        </AccountsDrawer>
      );
    } else if (isSplitScreen) {
      screenToShow = <SplitScreenNavigation />;
    } else {
      screenToShow = <Navigation />;
    }
  }

  return (
    <>
      {mainHeaders}
      {screenToShow}
      {/* Drawers that can be triggered from multiple places in the app */}
      <ExternalWalletPicker />
      <TransactionPreview />
    </>
  );
}
