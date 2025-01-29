import { Button, Linking, Text, View } from "react-native";
import { useLoginWithOAuth, useLogin } from "@privy-io/expo";
import {
  useLoginWithPasskey,
  useSignupWithPasskey,
} from "@privy-io/expo/passkey";
import Constants from "expo-constants";
import { useState } from "react";
import * as Application from "expo-application";
import { RELYING_PARTY } from "@/features/onboarding/passkey/passkey.constants";

export function LoginScreen() {
  const [error, setError] = useState("");
  const { loginWithPasskey } = useLoginWithPasskey({
    onError: (err) => {
      console.log(JSON.stringify(err.message, null, 2));
      setError(JSON.stringify(err.message));
    },
  });
  const { signupWithPasskey } = useSignupWithPasskey({
    onError: (err) => {
      console.log(JSON.stringify(err.message, null, 2));
      setError(JSON.stringify(err.message));
    },
  });

  const { login } = useLogin();
  // const oauth = useLoginWithOAuth({
  //   onError: (err) => {
  //     console.log(JSON.stringify(err, null, 2));
  //     setError(JSON.stringify(err.message));
  //   },
  // });

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
      <Text style={{ fontSize: 10 }}>
        {Constants.expoConfig?.extra?.privyAppId}
      </Text>
      <Text>Privy Client ID:</Text>
      <Text style={{ fontSize: 10 }}>
        {Constants.expoConfig?.extra?.privyClientId}
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
            .then(({ user }) => {
              console.log(JSON.stringify(user, null, 2));
            })
            .catch((err) => {
              setError(JSON.stringify(err.message));
            })
        }
      />

      {/* <View
        style={{ display: "flex", flexDirection: "column", gap: 5, margin: 10 }}
      >
        {["github", "google", "discord", "apple"].map((provider) => (
          <View key={provider}>
            <Button
              title={`Login with ${provider}`}
              disabled={oauth.state.status === "loading"}
              onPress={() => oauth.login({ provider } as LoginWithOAuthInput)}
            ></Button>
          </View>
        ))}
      </View> */}
      {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
    </View>
  );
}
