/* eslint-disable react-native/no-inline-styles */
import { Button, Linking, Text, View } from "react-native";
import Constants from "expo-constants";
import { useState } from "react";
import * as Application from "expo-application";
import { getConfig } from "@/config";
import { RELYING_PARTY } from "../onboarding/passkey.constants";
import logger from "@/utils/logger";
import { useAuthenticateWithPasskey } from "@/features/authentication/authenticate-with-passkey.context";
import { useNavigation } from "@react-navigation/native";
import { queryClient } from "@/queries/queryClient";
import { useLogout } from "@/features/authentication/use-logout.hook";
import {
  AuthStatuses,
  deleteStores,
  multiInboxStore,
} from "@/features/multi-inbox/multi-inbox.store";
import mmkv, { zustandMMKVStorage } from "@/utils/mmkv";

export function PrivyPlaygroundLoginScreen() {
  const { signupWithPasskey, loginWithPasskey } = useAuthenticateWithPasskey();
  // const navigation = useNavigation();
  const { logout } = useLogout();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        marginHorizontal: 10,
      }}
    >
      <Button
        title="Sign up with passkey"
        onPress={async () => {
          try {
            await signupWithPasskey();
            // @ts-ignore
            // navigation.replace("OnboardingCreateContactCard");
          } catch (error) {
            logger.debug(
              `[PrivyPlaygroundLoginScreen] Error signing up: ${error}`
            );
          }
        }}
      />

      <Button
        title="Sign in with passkey"
        onPress={async () => {
          try {
            await loginWithPasskey();
          } catch (error) {
            logger.debug(
              `[PrivyPlaygroundLoginScreen] Error logging in: ${error}`
            );
          }
        }}
      />

      <Button
        title="Delete Everything"
        onPress={async () => {
          const currentAccount = multiInboxStore.getState().currentSender;
          if (currentAccount) {
            deleteStores(currentAccount.ethereumAddress);
          }
          await logout();
          queryClient.clear();
          mmkv.clearAll();
        }}
      />
    </View>
  );
}
