/* eslint-disable react-native/no-inline-styles */
import { SafeAreaView, Text, View } from "react-native";
import Constants from "expo-constants";
import { usePrivy } from "@privy-io/expo";
import { PrivyPlaygroundLoginScreen } from "./privy-playground-login.screen";
import { PrivyPlaygroundUserScreen } from "./privy-playground-user.screen";
import { getConfig } from "@/config";
import logger from "@/utils/logger";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
export function PrivyPlaygroundLandingScreen() {
  logger.info("PrivyPlaygroundLandingScreen");
  useEffect(() => {
    logger.debug("Hiding splash screen");
    Constants.expoConfig?.splash?.hide?.();
    SplashScreen.hideAsync();
    logger.debug("Splash screen hidden");
  }, []);
  const { user, isReady } = usePrivy();
  // console.log({
  //   isReady,
  //   privyUserId: user?.id,
  //   linkedAccounts: user?.linked_accounts,
  //   // privy user id: did:privy:cm6gxcd7e00gj12og1dli30yy
  //   // passkey credential id: yIB9obMD0tmREIXceJt9k3owMO4
  //   // address: 0x6169558FcbcD862D629A49444f3A3E8Ab50E5aFb
  //   linkedeAccounts: JSON.stringify(user?.linked_accounts, null, 2),
  // });
  if ((getConfig().privy.appId as string).length !== 25) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>You have not set a valid `privyAppId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!(getConfig().privy.clientId as string).startsWith("client-")) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>You have not set a valid `privyClientId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }
  return !user ? <PrivyPlaygroundLoginScreen /> : <PrivyPlaygroundUserScreen />;
}
