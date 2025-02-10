/* eslint-disable react-native/no-inline-styles */
import { SafeAreaView, Text, View } from "react-native";
import Constants from "expo-constants";
import { PrivyPlaygroundLoginScreen } from "./privy-playground-login.screen";
import { PrivyPlaygroundUserScreen } from "./privy-playground-user.screen";
import { getConfig } from "@/config";
import logger from "@/utils/logger";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  AuthStatuses,
  useAccountsStore,
} from "../multi-inbox/multi-inbox.store";
export function PrivyPlaygroundLandingScreen() {
  logger.info("PrivyPlaygroundLandingScreen");
  useEffect(() => {
    logger.debug("Hiding splash screen");
    Constants.expoConfig?.splash?.hide?.();
    SplashScreen.hideAsync();
    logger.debug("Splash screen hidden");
  }, []);
  const { authStatus } = useAccountsStore();
  const isLoggedIn = authStatus === AuthStatuses.signedIn;

  return isLoggedIn ? (
    <PrivyPlaygroundUserScreen />
  ) : (
    <PrivyPlaygroundLoginScreen />
  );
}
