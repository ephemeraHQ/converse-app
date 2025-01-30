import React, { useState, useCallback, useEffect, useRef } from "react";
import { Text, View, Button, ScrollView, SafeAreaView } from "react-native";

import {
  usePrivy,
  useEmbeddedWallet,
  getUserEmbeddedEthereumWallet,
  getUserSmartWallet,
} from "@privy-io/expo";
import { PrivyUser } from "@privy-io/public-api";
import { Client, Signer } from "@xmtp/react-native-sdk";
import { ClientOptions } from "@xmtp/react-native-sdk/build/lib/Client";
import { Center } from "@/design-system/Center";
import logger from "@/utils/logger";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";

const toMainIdentifier = (x: PrivyUser["linked_accounts"][number]) => {
  if (x.type === "phone") {
    return x.phoneNumber;
  }
  if (x.type === "email" || x.type === "wallet") {
    return x.address;
  }

  if (x.type === "twitter_oauth" || x.type === "tiktok_oauth") {
    return x.username;
  }

  if (x.type === "custom_auth") {
    return x.custom_user_id;
  }

  return x.type;
};

export const UserScreen = () => {
  const { logout, user } = usePrivy();
  const { client: smartWalletClient } = useSmartWallets();
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [xmtpClientError, setXmtpClientError] = useState<string | null>(null);

  const wallet = useEmbeddedWallet();

  const ethereumSmartContractWallet = getUserSmartWallet(user);
  const clientEthereumSmartContractAccount = smartWalletClient?.account;

  const isCreatingClient = useRef(false);

  useEffect(() => {
    return;
    const buildExistingClient = async () => {
      if (
        !ethereumSmartContractWallet?.address ||
        wallet.status !== "connected" ||
        xmtpClient ||
        isCreatingClient.current
      ) {
        logger.debug(`[UserScreen] Skipping XMTP client build`);
        return;
      }

      logger.debug(`[UserScreen] Building XMTP client`);
      setIsLoadingClient(true);
      setXmtpClientError(null);
      isCreatingClient.current = true;

      try {
        const encoder = new TextEncoder();
        const addressBytes = encoder.encode(
          ethereumSmartContractWallet.address
        );
        const keyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          keyBytes[i] = addressBytes[i % addressBytes.length];
        }

        const client = await Client.build(ethereumSmartContractWallet.address, {
          env: "dev",
          dbEncryptionKey: keyBytes,
        });

        setXmtpClient(client);
        logger.debug(
          `[UserScreen] Successfully built XMTP client for address: ${ethereumSmartContractWallet.address}`
        );
      } catch (error) {
        const errorMsg = `Failed to build XMTP client: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        logger.error(`[UserScreen] ${errorMsg}`, error);
        setXmtpClientError(errorMsg);
      } finally {
        setIsLoadingClient(false);
        isCreatingClient.current = false;
      }
    };

    // Only run if wallet is connected and smart contract wallet exists
    if (wallet.status === "connected" && ethereumSmartContractWallet) {
      buildExistingClient();
    }
  }, [
    ethereumSmartContractWallet?.address,
    wallet.status,
    xmtpClient,
    ethereumSmartContractWallet,
  ]);

  const createXmtpClient = useCallback(async () => {
    if (
      !ethereumSmartContractWallet?.address ||
      wallet.status !== "connected" ||
      !smartWalletClient
    ) {
      logger.debug(
        `[UserScreen] Cannot create XMTP client - smart wallet: ${ethereumSmartContractWallet?.address}, wallet status: ${wallet.status}`
      );
      alert("Smart wallet not ready");
      return;
    }

    logger.debug(
      `[UserScreen] Creating new XMTP client for smart wallet: ${ethereumSmartContractWallet.address}`
    );
    setIsLoadingClient(true);
    setXmtpClientError(null);
    try {
      const signer: Signer = {
        getAddress: () => Promise.resolve(smartWalletClient.account.address),
        signMessage: async (message: string) => {
          const signature = await smartWalletClient.signMessage({
            message,
          });
          return signature;
        },
        getChainId: () => 8453,
        getBlockNumber: () => 0,
        walletType: () => "SCW",
      };

      const encoder = new TextEncoder();
      const addressBytes = encoder.encode(ethereumSmartContractWallet.address);
      const keyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        keyBytes[i] = addressBytes[i % addressBytes.length];
      }

      const options: ClientOptions = {
        env: "dev",
        dbEncryptionKey: keyBytes,
      };

      const client = await Client.create(signer, options);
      setXmtpClient(client);
      setXmtpClientError(null);
      logger.debug(
        `[UserScreen] Successfully created XMTP client for smart wallet: ${ethereumSmartContractWallet.address}`
      );
      alert("XMTP client created successfully!");
    } catch (error) {
      const errorMsg = `Failed to create XMTP client: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      logger.error(`[UserScreen] ${errorMsg}`, error);
      setXmtpClientError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsLoadingClient(false);
    }
  }, [ethereumSmartContractWallet, wallet, smartWalletClient]);

  // Add this useEffect for automatic wallet creation
  useEffect(() => {
    if (wallet.status === "not-created") {
      logger.debug("[UserScreen] Automatically creating wallet");
      wallet.create().catch((error) => {
        logger.error("[UserScreen] Wallet creation failed:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.status]);

  // Modify existing useEffect to handle auto-client creation
  useEffect(() => {
    !ethereumSmartContractWallet?.address ||
      wallet.status !== "connected" ||
      !smartWalletClient;
    const handleAutoClientCreation = async () => {
      if (
        wallet.status === "connected" &&
        ethereumSmartContractWallet &&
        !xmtpClient &&
        !isLoadingClient &&
        !isCreatingClient.current
      ) {
        logger.debug(
          "[UserScreen] Automatically creating XMTP client for smart wallet"
        );
        isCreatingClient.current = true;
        try {
          await createXmtpClient();
        } finally {
          isCreatingClient.current = false;
        }
      }
    };

    handleAutoClientCreation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.status, xmtpClient, isLoadingClient, ethereumSmartContractWallet]);

  // return null;

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView>
      <Center>
        <View>
          {isLoadingClient && (
            <Text style={{ textAlign: "center", margin: 10 }}>
              Loading XMTP client...
            </Text>
          )}
          {xmtpClient && (
            <View
              style={{ padding: 10, backgroundColor: "#f0f0f0", margin: 10 }}
            >
              <Text style={{ fontWeight: "bold" }}>XMTP Client Info:</Text>
              <Text>Address: {xmtpClient.address}</Text>
              <Text>Inbox ID: {xmtpClient.inboxId}</Text>
            </View>
          )}

          {xmtpClientError && (
            <View
              style={{ padding: 10, backgroundColor: "#ffe6e6", margin: 10 }}
            >
              <Text style={{ color: "red", fontWeight: "bold" }}>Error:</Text>
              <Text style={{ color: "red" }}>{xmtpClientError}</Text>
            </View>
          )}

          <ScrollView
            style={{ borderColor: "rgba(0,0,0,0.1)", borderWidth: 1 }}
          >
            <View
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <View>
                <Text style={{ fontWeight: "bold" }}>User ID</Text>
                <Text>{user.id}</Text>
              </View>

              <View>
                <Text style={{ fontWeight: "bold" }}>Linked accounts</Text>
                {user?.linked_accounts.length ? (
                  <View style={{ display: "flex", flexDirection: "column" }}>
                    {user?.linked_accounts?.map((m) => (
                      <Text
                        key={toMainIdentifier(m)}
                        style={{
                          color: "rgba(0,0,0,0.5)",
                          fontSize: 12,
                          fontStyle: "italic",
                        }}
                      >
                        {JSON.stringify(m, null, 2)}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>

              <View>
                {ethereumSmartContractWallet?.address && (
                  <>
                    <Text style={{ fontWeight: "bold" }}>Embedded Wallet</Text>
                    <Text>{ethereumSmartContractWallet?.address}</Text>
                  </>
                )}

                {wallet.status === "connecting" && (
                  <Text>Loading wallet...</Text>
                )}

                {wallet.status === "error" && <Text>{wallet.error}</Text>}

                {wallet.status === "not-created" && (
                  <Button
                    title="Create Wallet"
                    onPress={() => wallet.create()}
                  />
                )}
              </View>

              <View style={{ display: "flex", flexDirection: "column" }}></View>
              <Button title="Logout" onPress={logout} />
            </View>
          </ScrollView>
        </View>
      </Center>
    </SafeAreaView>
  );
};
