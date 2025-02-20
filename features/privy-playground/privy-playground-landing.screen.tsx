/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  View,
  ScrollView,
  Button,
  TextInput,
} from "react-native";
import {
  AuthStatuses,
  useAccountsStore,
  useCurrentProfile,
  useCurrentSender,
} from "../multi-inbox/multi-inbox.store";
import { ethers } from "ethers";
import { usePrivy } from "@privy-io/expo";
import { useAuthenticateWithPasskey } from "../authentication/authenticate-with-passkey.context";
import { useLogout } from "@/features/authentication/use-logout.hook";
import { ConnectWalletBottomSheet } from "../wallets/connect-wallet.bottom-sheet";
import { useCreateUser } from "../current-user/use-create-user";
import {
  ensureJwtQueryData,
  fetchJwtQueryData,
  invalidateJwtQueryData,
  setJwtQueryData,
  useJwtQuery,
} from "../authentication/jwt.query";
import { useMMKVListener, useMMKVString } from "react-native-mmkv";
import { secureQueryMMKV } from "@/utils/mmkv";
import { getCurrentAccountPrimaryProfile } from "@/utils/profile/getCurrentAccountPrimaryProfile";
import {
  fetchProfileQuery,
  invalidateProfileQuery,
} from "../profiles/profiles.query";
import { useLogoutOnJwtRefreshError } from "../authentication/use-logout-on-jwt-refresh-error";
import { buildDeviceMetadata } from "@/utils/device-metadata";

export function PrivyPlaygroundLandingScreen() {
  useLogoutOnJwtRefreshError();
  const { loginWithPasskey, signupWithPasskey } = useAuthenticateWithPasskey();
  const authStatus = useAccountsStore((state) => state.authStatus);
  const isSigningUp = authStatus === AuthStatuses.signingUp;
  const currentSender = useCurrentSender();
  const { user: privyUser } = usePrivy();
  // const authStatus = useAuthStatus();
  const { data: jwt } = useJwtQuery();
  const { logout } = useLogout();
  const { mutate: createUser, isPending: isCreatingUser } = useCreateUser();
  const canCreateUser =
    currentSender?.ethereumAddress !== undefined &&
    currentSender.inboxId !== undefined &&
    isSigningUp;
  // const {
  //   data: currentProfile,
  //   status: currentProfileStatus,
  //   error,
  // } = useCurrentProfile();

  const [
    shouldShowConnectWalletBottomSheet,
    setShouldShowConnectWalletBottomSheet,
  ] = useState(false);

  useMMKVListener((key) => {}, secureQueryMMKV);

  return (
    <SafeAreaView>
      <ScrollView style={{ borderColor: "rgba(0,0,0,0.1)", borderWidth: 1 }}>
        <View
          style={{
            padding: 20,
            flex: 1,
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <Text>JWT: {JSON.stringify(!!jwt ? jwt : "nothin", null, 2)}</Text>
          <Button
            title="fetch profile"
            onPress={async () => {
              await invalidateProfileQuery({
                xmtpId: currentSender?.inboxId!,
              });
              const profile = await fetchProfileQuery({
                xmtpId: currentSender?.inboxId!,
              });
              alert(JSON.stringify(profile, null, 2));
            }}
          />
          <Button
            title="refetch JWT"
            onPress={async () => {
              await invalidateJwtQueryData();
              const jwt = await fetchJwtQueryData();
            }}
          />
          <Button title="clear JWT" onPress={() => setJwtQueryData("")} />
          <Button
            title="silly JWT"
            onPress={() => setJwtQueryData("silly JWT")}
          />
          {canCreateUser && (
            <Button
              title="Create User"
              onPress={() =>
                createUser(
                  {
                    privyUserId: privyUser!.id,
                    smartContractWalletAddress: currentSender.ethereumAddress,
                    inboxId: currentSender.inboxId,
                    profile: {
                      name: `Test User: ${Math.random()}`,
                      avatar: "https://placehold.co/100x100",
                      description: "random description",
                    },
                  },
                  {
                    async onSuccess(data, variables, context) {
                      const jwt = await ensureJwtQueryData();
                      useAccountsStore
                        .getState()
                        .setAuthStatus(AuthStatuses.signedIn);
                    },
                    onError(error, variables, context) {},
                  }
                )
              }
            />
          )}
          {/* <Text>JWT: {JSON.stringify(!!jwt ? jwt : "nothin", null, 2)}</Text> */}
          <Text>
            Something: {JSON.stringify({ authStatus, isCreatingUser }, null, 2)}
          </Text>
          <Text>Current Sender: {JSON.stringify(currentSender, null, 2)}</Text>
          {/* <Text>Current Profile Status: {currentProfileStatus}</Text>
          <Text>Current Profile Error: {error?.message}</Text>
          <Text>
            Current Profile: {JSON.stringify(currentProfile, null, 2)}
          </Text> */}

          <Button
            title="Connect Wallet"
            onPress={() => setShouldShowConnectWalletBottomSheet(true)}
          />

          <Button
            disabled={authStatus !== AuthStatuses.signedOut}
            title="Login with Passkey"
            onPress={loginWithPasskey}
          />
          <Button
            disabled={authStatus !== AuthStatuses.signedOut}
            title="Signup with Passkey"
            onPress={signupWithPasskey}
          />
          <Button
            // disabled={authStatus !== AuthStatuses.signedIn}
            title="Logout"
            onPress={async () => {
              try {
                await logout();
              } catch (error) {}
            }}
          />
          <ConnectWalletBottomSheet
            isVisible={shouldShowConnectWalletBottomSheet}
            onClose={() => {}}
            onWalletImported={(socialIdentity) => {
              createUser({
                privyUserId: privyUser!.id,
                smartContractWalletAddress: currentSender!.ethereumAddress!,
                inboxId: currentSender!.inboxId!,
                profile: {
                  name: socialIdentity.name,
                  avatar: socialIdentity.avatar,
                  description: socialIdentity.bio,
                },
              });
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
