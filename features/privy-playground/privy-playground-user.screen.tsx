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
const coinbaseUrl = new URL(`https://${config.websiteDomain}/coinbase`);
const multiInboxClient = MultiInboxClient.instance;

export const PrivyPlaygroundUserScreen = () => {
  useCoinbaseWalletListener(true, coinbaseUrl);

  const { logout, user } = usePrivy();
  user?.custom_metadata;

  const { connect: notquiteworkingsmoothlyyetbutwillcomeback } = useConnect();
  const {
    create: createEmbeddedWallet,
    // @ts-ignore
    error: embeddedWalletError,
    wallets: embeddedWallets,
  } = useEmbeddedEthereumWallet();
  const smartcontractWallets = user?.linked_accounts.filter(
    (w) => w.type === "smart_wallet"
  );
  const { client: smartWalletClient } = useSmartWallets();

  const account = getUserEmbeddedEthereumWallet(user);

  const ethereumSmartWallet = smartWalletClient?.account;

  const [randomWallets, setRandomWallets] = useState<Wallet[]>([]);
  const addWalletToRandomWalletsList = (wallet: Wallet) => {
    setRandomWallets([...randomWallets, wallet]);
  };

  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [clientState, setClientState] = useState<InboxState | null>(null);
  // const { customMetadata, updateMetadata } =
  //   usePrivyUserCustomMetadataForCurrentAccount();

  // useCreateEmbeddedWalletIfNotCreated()
  // useEffect(() => {
  //   if (embeddedWalletStatus === "not-created") {
  //     createEmbeddedWallet();
  //   }
  // }, [embeddedWalletStatus, createEmbeddedWallet]);

  if (!user) {
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
          <Button
            title={"Initialize MultiInboxClient"}
            onPress={async () => {
              try {
                logger.debug(
                  "[initializeMultiInboxClient] Starting initialization"
                );

                logger.debug(
                  "[initializeMultiInboxClient] MultiInboxClient instance created"
                );

                // multiInboxClient.addInboxCreatedObserver(
                //   async ({ ethereumAddress, xmtpInbox }) => {
                //     logger.debug(
                //       `[multiInboxClient] Inbox created for address: ${ethereumAddress}`
                //     );
                //     logger.debug(
                //       `[multiInboxClient] Getting inbox state for address: ${ethereumAddress}`
                //     );

                //     try {
                //       const inboxState = await xmtpInbox.inboxState(true);

                //       logger.debug(
                //         `[multiInboxClient] Successfully retrieved inbox state for address: ${ethereumAddress}`
                //       );
                //       logger.debug(
                //         `[multiInboxClient] Inbox state: ${JSON.stringify(
                //           inboxState,
                //           null,
                //           2
                //         )}`
                //       );
                //       setXmtpClient(xmtpInbox);
                //       setClientState(inboxState);
                //     } catch (error) {
                //       logger.error(
                //         `[multiInboxClient] Error getting inbox state for address: ${ethereumAddress}`,
                //         error
                //       );
                //       throw error;
                //     }
                //   }
                // );

                logger.debug(
                  "[initializeMultiInboxClient] Inbox created observer added"
                );

                logger.debug(
                  "[initializeMultiInboxClient] Error observer added"
                );

                if (!smartWalletClient) {
                  logger.error(
                    "[initializeMultiInboxClient] Smart wallet client not available"
                  );
                  throw new Error("Smart wallet client not available");
                }

                if (!user) {
                  logger.error(
                    "[initializeMultiInboxClient] User not available"
                  );
                  throw new Error("User not available");
                }

                logger.debug(
                  "[initializeMultiInboxClient] Starting client initialization"
                );
                // await multiInboxClient.initialize({
                //   privyUser: user,
                //   privySmartWalletClient: smartWalletClient,
                //   // wallet: embeddedWallets[0],
                // });
                logger.debug(
                  "[initializeMultiInboxClient] Client initialization completed successfully"
                );
              } catch (error) {
                logger.error(
                  "[initializeMultiInboxClient] Fatal error during initialization",
                  error
                );
                throw error;
              }
            }}
          />
          {/* <WalletLinkButtons
            onPress={notquiteworkingsmoothlyyetbutwillcomeback}
            xmtpClient={xmtpClient}
          /> */}
          <View>
            <Text style={{ fontWeight: "bold" }}>Privy User ID</Text>
            <Text>{user.id}</Text>
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

            <Button
              title="Create embedded wallet"
              onPress={async () => {
                const randomWallet = await createRandomWallet();
                addWalletToRandomWalletsList(randomWallet);
              }}
            />

            {/* <Text>{JSON.stringify(customMetadata, null, 2)}</Text> */}
            {/* List of all installations in the xmtp client state */}
            <View
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.1)",
                padding: 12,
              }}
            >
              {clientState?.installations.map((installation) => (
                <View key={installation.id}>
                  <Text style={{ fontWeight: "bold" }}>
                    installationId: {installation.id}
                  </Text>
                  {/* List of all addresses in the installation */}
                  {clientState?.addresses.map((address) => {
                    // const isAddressActiveForInstallation =
                    //   customMetadata?.inboxActiveByInstallation[
                    //     installation.id
                    //   ]?.[address];
                    return (
                      <>
                        <Text style={{ paddingLeft: 12 }} key={address}>
                          address: {address}
                        </Text>
                        {/* <Switch
                          value={isAddressActiveForInstallation}
                          onValueChange={() => {
                            const updatedInstallationState: IPrivyCustomMetadata =
                              {
                                ...customMetadata,
                                inboxActiveByInstallation: {
                                  ...customMetadata?.inboxActiveByInstallation,
                                  [installation.id]: {
                                    ...customMetadata
                                      ?.inboxActiveByInstallation[
                                      installation.id
                                    ],
                                    [address]: !isAddressActiveForInstallation,
                                  },
                                },
                              };

                            updateMetadata(updatedInstallationState);
                          }}
                        /> */}
                      </>
                    );
                  })}
                </View>
              ))}
            </View>

            <View>
              {xmtpClient ? (
                <>
                  <Text style={{ fontWeight: "bold" }}>Xmtp Client</Text>
                  <Text style={{ fontWeight: "bold" }}>
                    Xmtp Client Installation ID
                  </Text>
                  <Text>{xmtpClient.installationId}</Text>
                  {/* <Text>{JSON.stringify(clientState, null, 2)}</Text> */}
                  <Text style={{ fontWeight: "bold" }}>Address:</Text>
                  <Text>{xmtpClient.address}</Text>
                  <Text style={{ fontWeight: "bold" }}>Inbox ID:</Text>
                  <Text>{xmtpClient.inboxId}</Text>
                  <Text style={{ fontWeight: "bold" }}>Addresses:</Text>
                  {clientState && (
                    <Text>
                      {JSON.stringify(clientState.addresses, null, 2)}
                    </Text>
                  )}
                  {clientState && (
                    <>
                      <Text style={{ fontWeight: "bold" }}>
                        Recovery Address:
                      </Text>
                      <Text>
                        {JSON.stringify(clientState.recoveryAddress, null, 2)}
                      </Text>
                    </>
                  )}
                </>
              ) : (
                <Text>Client not created</Text>
              )}
            </View>
            <View>
              {account?.address && (
                <>
                  <Text style={{ fontWeight: "bold" }}>Embedded Wallet</Text>
                  <Text>{account?.address}</Text>
                </>
              )}

              {ethereumSmartWallet?.address ? (
                <>
                  <Text style={{ fontWeight: "bold" }}>Smart Wallet</Text>
                  <Text>{ethereumSmartWallet?.address}</Text>
                </>
              ) : (
                <Text>Waiting on smart wallet creation...</Text>
              )}
            </View>

            <Button
              title="Logout Privy (this keeps all data on device)"
              onPress={() => {
                multiInboxClient.logoutMessagingClients({
                  shouldDestroyLocalData: true,
                });
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
