/* eslint-disable react-native/no-color-literals */

/* eslint-disable react-native/no-inline-styles */
// <Text>run this example on iphone 16 plus</Text>
// 16 plus
import React, { useEffect, useState } from "react";
import { Text, View, Button, ScrollView, SafeAreaView } from "react-native";

import {
  usePrivy,
  useEmbeddedWallet,
  getUserEmbeddedEthereumWallet,
  usePrivyClient,
  useEmbeddedEthereumWallet,
} from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import logger from "@/utils/logger";
import { base } from "viem/chains";
import { config } from "@/config";
import { Client, Signer } from "@xmtp/react-native-sdk";
import { Wallet } from "ethers";
import { utils } from "@noble/secp256k1";

import { useConnect } from "thirdweb/react";
import { Account, createWallet, WalletId } from "thirdweb/wallets";
import { thirdwebClient } from "@/utils/thirdweb";
import { useCoinbaseWalletListener } from "@/utils/coinbaseWallet";
import { MultiInboxClient } from "../multi-inbox/multi-inbox.client";
// import {
//   IPrivyCustomMetadata,
//   usePrivyUserCustomMetadataForCurrentAccount,
// } from "@/queries/use-privy-user-custom-metadata";
import { InboxState } from "@xmtp/react-native-sdk/build/lib/InboxState";
import { AuthenticateWithPasskeyProvider } from "../onboarding/contexts/signup-with-passkey.context";
import {
  AuthStatuses,
  useMultiInboxClientStore,
} from "../multi-inbox/multi-inbox.store";
import { useLogout } from "@/utils/logout";
const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);

export const PrivyPlaygroundUserScreen = () => {
  useCoinbaseWalletListener(true, coinbaseUrl);

  const { user } = usePrivy();
  const { logout } = useLogout();
  const { currentSender, authStatus } = useMultiInboxClientStore();

  const { client: smartWalletClient } = useSmartWallets();

  if (authStatus !== AuthStatuses.signedIn) {
    return null;
  }

  return (
    <SafeAreaView>
      <ScrollView style={{ borderColor: "rgba(0,0,0,0.1)", borderWidth: 1 }}>
        {/* todos... */}
        <View
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <View>
            <Text style={{ fontWeight: "bold" }}>Privy User ID</Text>
            <Text>ETHEREUM ADDRESS: {currentSender?.ethereumAddress}</Text>
            <Text>XMTP inbox: {currentSender?.inboxId}</Text>
            <View>
              <Text style={{ fontWeight: "bold" }}>
                Linked accounts from Privy
              </Text>
              {user?.linked_accounts.length ? (
                <View style={{ display: "flex", flexDirection: "column" }}>
                  {user?.linked_accounts?.map((m) => (
                    <Text
                      key={JSON.stringify(m)}
                      style={{
                        color: "rgba(0,0,0,0.5)",
                        fontSize: 12,
                        fontStyle: "italic",
                      }}
                    >
                      {JSON.stringify(
                        // @ts-ignore
                        { type: m.type, address: m.address },
                        null,
                        2
                      )}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>

            <View>
              {currentSender?.inboxId ? (
                <>
                  <Text style={{ fontWeight: "bold" }}>Xmtp Client</Text>
                  <Text style={{ fontWeight: "bold" }}>
                    Xmtp Client Installation ID
                  </Text>
                  <Text style={{ fontWeight: "bold" }}>Address:</Text>
                  <Text>{currentSender?.inboxId}</Text>
                  <Text style={{ fontWeight: "bold" }}>Inbox ID:</Text>
                  <Text>{currentSender?.ethereumAddress}</Text>
                  <Text style={{ fontWeight: "bold" }}>Addresses:</Text>
                </>
              ) : (
                <Text>Client not created</Text>
              )}
            </View>

            <Button
              title="Logout Privy (this keeps all data on device)"
              onPress={() => {
                // multiInboxClient.logoutMessagingClients({
                //   shouldDestroyLocalData: true,
                // });
                // logout();
                logout();
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createRandomWallet = async () => {
  const signer = new Wallet(utils.randomPrivateKey());
  return signer;
};
