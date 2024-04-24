import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef } from "react";
import { Dimensions, Platform, useColorScheme } from "react-native";

import SendAttachmentPreview from "../components/Chat/Attachment/SendAttachmentPreview";
import AddressBook from "../components/Onboarding/AddressBook";
import WarpcastConnect from "../components/Onboarding/WarpcastConnect";
import ActionSheetStateHandler from "../components/StateHandlers/ActionSheetStateHandler";
import HydrationStateHandler from "../components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "../components/StateHandlers/InitialStateHandler";
import MainIdentityStateHandler from "../components/StateHandlers/MainIdentityStateHandler";
import NetworkStateHandler from "../components/StateHandlers/NetworkStateHandler";
import NotificationsStateHandler from "../components/StateHandlers/NotificationsStateHandler";
import WalletsStateHandler from "../components/StateHandlers/WalletsStateHandler";
import {
  useCurrentAccount,
  useSettingsStore,
  useProfilesStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { useSelect } from "../data/store/storeHelpers";
import { useAddressBookStateHandler } from "../utils/addressBook";
import { backgroundColor } from "../utils/colors";
import { converseEventEmitter } from "../utils/events";
import { usePrivyAccessToken } from "../utils/evm/privy";
import AccountsAndroid from "./Accounts/AccountsAndroid";
import AccountsDrawer from "./Accounts/AccountsDrawer";
import Navigation from "./Navigation/Navigation";
import SplitScreenNavigation from "./Navigation/SplitScreenNavigation/SplitScreenNavigation";
import { useIsSplitScreen } from "./Navigation/navHelpers";
import NotificationsScreen from "./NotificationsScreen";
import Onboarding from "./Onboarding";

export default function Main() {
  // Makes sure we have a Privy token ready to make API calls
  usePrivyAccessToken();
  useAddressBookStateHandler();
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount();
  const socials = useProfilesStore((s) =>
    userAddress ? s.profiles[userAddress]?.socials : undefined
  );
  // const currentUserName = socials?.userNames?.find((e) => e.isPrimary)?.name;
  const currentFarcaster = socials?.farcasterUsernames?.find(
    (e) => e.linkedAccount
  );
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

  const { notifications, skipFarcaster } = useSettingsStore(
    useSelect(["notifications", "skipFarcaster"])
  );
  const {
    notificationsPermissionStatus,
    splashScreenHidden,
    mediaPreview,
    addressBookPermissionStatus,
  } = useAppStore(
    useSelect([
      "notificationsPermissionStatus",
      "splashScreenHidden",
      "mediaPreview",
      "addressBookPermissionStatus",
    ])
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
      <NotificationsStateHandler />
      <ActionSheetStateHandler />
      <WalletsStateHandler />
    </>
  );

  let screenToShow = undefined;

  if (splashScreenHidden) {
    if (!userAddress || addingNewAccount) {
      screenToShow = <Onboarding />;
    } else if (!currentFarcaster && !skipFarcaster) {
      return <WarpcastConnect />;
    } else if (
      Platform.OS !== "web" &&
      addressBookPermissionStatus === "undetermined"
    ) {
      return <AddressBook />;
    } else if (
      notifications.showNotificationScreen &&
      Platform.OS !== "web" &&
      (notificationsPermissionStatus === "undetermined" ||
        (notificationsPermissionStatus === "denied" &&
          Platform.OS === "android"))
    ) {
      screenToShow = <NotificationsScreen />;
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
      {mediaPreview?.mediaURI && <SendAttachmentPreview />}
    </>
  );
}
