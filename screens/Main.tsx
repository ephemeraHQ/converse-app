import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  DrawerLayoutAndroid,
  Platform,
  useColorScheme,
} from "react-native";

import ChatSendAttachment from "../components/Chat/ChatSendAttachment";
import ActionSheetStateHandler from "../components/StateHandlers/ActionSheetStateHandler";
import HydrationStateHandler from "../components/StateHandlers/HydrationStateHandler";
import InitialStateHandler from "../components/StateHandlers/InitialStateHandler";
import MainIdentityStateHandler from "../components/StateHandlers/MainIdentityStateHandler";
import NetworkStateHandler from "../components/StateHandlers/NetworkStateHandler";
import NotificationsStateHandler from "../components/StateHandlers/NotificationsStateHandler";
import { useSettingsStore, useUserStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { backgroundColor } from "../utils/colors";
import { converseEventEmitter } from "../utils/events";
import { pick } from "../utils/objects";
import AccountsAndroid from "./Accounts/AccountsAndroid";
import Navigation from "./Navigation/Navigation";
import NotificationsScreen from "./NotificationsScreen";
import OnboardingScreen from "./Onboarding";

// This handler determines how your app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function Main() {
  const colorScheme = useColorScheme();
  const userAddress = useUserStore((s) => s.userAddress);
  const {
    desktopConnectSessionId,
    setDesktopConnectSessionId,
    addingNewAccount,
  } = useOnboardingStore((s) =>
    pick(s, [
      "desktopConnectSessionId",
      "setDesktopConnectSessionId",
      "addingNewAccount",
    ])
  );
  // Once the user is fully connected, let's remove the Desktop Connect session id
  useEffect(() => {
    if (desktopConnectSessionId && userAddress) {
      setDesktopConnectSessionId(null);
    }
  }, [desktopConnectSessionId, setDesktopConnectSessionId, userAddress]);
  const showNotificationScreen = useSettingsStore(
    (s) => s.notifications.showNotificationScreen
  );
  const { notificationsPermissionStatus, splashScreenHidden, mediaPreview } =
    useAppStore((s) =>
      pick(s, [
        "notificationsPermissionStatus",
        "splashScreenHidden",
        "mediaPreview",
      ])
    );
  const navigationDrawer = useRef<DrawerLayoutAndroid>(null);
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
      <StatusBar
        hidden={false}
        backgroundColor={backgroundColor(colorScheme)}
        style={colorScheme === "dark" ? "light" : "dark"}
      />
      <HydrationStateHandler />
      <InitialStateHandler />
      <NetworkStateHandler />
      <MainIdentityStateHandler />
      <NotificationsStateHandler />
      <ActionSheetStateHandler />
    </>
  );

  let screenToShow = undefined;

  if (splashScreenHidden) {
    if (!userAddress || addingNewAccount) {
      screenToShow = <OnboardingScreen />;
    } else if (
      showNotificationScreen &&
      (notificationsPermissionStatus === "undetermined" ||
        (notificationsPermissionStatus === "denied" &&
          Platform.OS === "android"))
    ) {
      screenToShow = <NotificationsScreen />;
    } else if (Platform.OS === "android") {
      // On Android the whole navigation is wrapped in a drawler
      // layout to be able to display the menu
      screenToShow = (
        <DrawerLayoutAndroid
          ref={navigationDrawer}
          drawerWidth={Dimensions.get("screen").width * 0.77}
          renderNavigationView={() => <AccountsAndroid />}
        >
          <Navigation />
        </DrawerLayoutAndroid>
      );
    } else {
      screenToShow = <Navigation />;
    }
  }

  return (
    <>
      {mainHeaders}
      {screenToShow}
      {mediaPreview?.mediaURI && <ChatSendAttachment />}
    </>
  );
}
