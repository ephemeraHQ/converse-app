/* eslint-disable react-native/no-inline-styles */
import { Button, Linking, Text, View } from "react-native";
import {
  useLoginWithPasskey,
  useSignupWithPasskey,
} from "@privy-io/expo/passkey";
import Constants from "expo-constants";
import { useState } from "react";
import * as Application from "expo-application";
import { getConfig } from "@/config";
import { RELYING_PARTY } from "../onboarding/passkey/passkey.constants";
import logger from "@/utils/logger";
export function PrivyPlaygroundLoginScreen() {
  const [error, setError] = useState("");
  const { loginWithPasskey } = useLoginWithPasskey({
    onSuccess: (user, isNewUser) => {
      logger.debug(
        `[PrivyPlaygroundLoginScreen] ${
          isNewUser ? "New" : "Existing"
        } user logged in with passkey: ${user.id}`
      );
      // if we're a new user, we need to create an embedded wallet
    },
    onError: (err) => {
      console.log(JSON.stringify(err.message, null, 2));
      setError(JSON.stringify(err.message));
    },
  });
  const { signupWithPasskey } = useSignupWithPasskey({
    onSuccess: (user, isNewUser) => {
      logger.debug(
        `[PrivyPlaygroundLoginScreen] ${
          isNewUser ? "New" : "Existing"
        } user signed up with passkey: ${user.id}`
      );
      // if we're a new user, we need to create an embedded wallet
    },
    onError: (err) => {
      console.log(JSON.stringify(err.message, null, 2));
      setError(JSON.stringify(err.message));
    },
  });

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
      <Text>Privy App ID:</Text>
      <Text style={{ fontSize: 10 }}>{getConfig().privy.appId}</Text>
      <Text>Privy Client ID:</Text>
      <Text style={{ fontSize: 10 }}>{getConfig().privy.clientId}</Text>
      <Text>
        Navigate to your{" "}
        <Text
          onPress={() =>
            Linking.openURL(
              `https://dashboard.privy.io/apps/${Constants.expoConfig?.extra?.privyAppId}/settings?setting=clients`
            )
          }
        >
          dashboard
        </Text>{" "}
        and ensure the following Expo Application ID is listed as an `Allowed
        app identifier`:
      </Text>
      <Text style={{ fontSize: 10 }}>{Application.applicationId}</Text>
      <Text>
        Navigate to your{" "}
        <Text
          onPress={() =>
            Linking.openURL(
              `https://dashboard.privy.io/apps/${Constants.expoConfig?.extra?.privyAppId}/settings?setting=clients`
            )
          }
        >
          dashboard
        </Text>{" "}
        and ensure the following value is listed as an `Allowed app URL scheme`:
      </Text>
      <Text style={{ fontSize: 10 }}>
        {Application.applicationId === "host.exp.Exponent"
          ? "exp"
          : Constants.expoConfig?.scheme}
      </Text>

      <Button
        title="Login using Passkey"
        onPress={() =>
          loginWithPasskey({
            relyingParty: RELYING_PARTY,
          })
        }
      />

      <Button
        title="Create Passkey"
        onPress={() =>
          signupWithPasskey({
            relyingParty: RELYING_PARTY,
          })
            // .then(({ user }) => {
            //   console.log(JSON.stringify(user, null, 2));
            // })
            .catch((err) => {
              setError(JSON.stringify(err.message));
            })
        }
      />

      {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
    </View>
  );
}
