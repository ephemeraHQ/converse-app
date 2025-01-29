import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Text,
  TextInput,
  View,
  Button,
  ScrollView,
  SafeAreaView,
} from "react-native";

import {
  usePrivy,
  useOAuthFlow,
  useEmbeddedWallet,
  getUserEmbeddedWallet,
  PrivyEmbeddedWalletProvider,
  getUserEmbeddedEthereumWallet,
} from "@privy-io/expo";
import Constants from "expo-constants";
import { useLinkWithPasskey } from "@privy-io/expo/passkey";
import { PrivyUser } from "@privy-io/public-api";
import { RELYING_PARTY } from "@/features/onboarding/passkey/passkey.constants";
import { Client, Signer } from "@xmtp/react-native-sdk";
import { ethers } from "ethers";
import { ClientOptions } from "@xmtp/react-native-sdk/build/lib/Client";
import { Center } from "@/design-system/Center";
import logger from "@/utils/logger";

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
  const [password, setPassword] = useState("");
  const [chainId, setChainId] = useState("1");
  const [signedMessages, setSignedMessages] = useState<string[]>([]);
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [xmtpClientError, setXmtpClientError] = useState<string | null>(null);

  const { logout, user } = usePrivy();
  const { linkWithPasskey } = useLinkWithPasskey();
  // const oauth = useOAuthFlow();
  const wallet = useEmbeddedWallet();
  const account = getUserEmbeddedEthereumWallet(user);

  const isCreatingClient = useRef(false);

  const signMessage = useCallback(
    async (provider: PrivyEmbeddedWalletProvider) => {
      try {
        logger.debug(
          `[UserScreen] Signing message for address: ${account?.address}`
        );
        const constantPlaintext = "foobar";
        const signedConstantPlaintext = await provider.request({
          method: "personal_sign",
          params: [constantPlaintext, account?.address],
        });
        if (signedConstantPlaintext) {
          const withConstantPlaintext = `${constantPlaintext}\n${signedConstantPlaintext}`;
          setSignedMessages((prev) => prev.concat(withConstantPlaintext));
          logger.debug(
            `[UserScreen] Successfully signed message for address: ${account?.address}`
          );
        }
      } catch (e) {
        logger.error(`[UserScreen] Error signing message: ${e}`);
      }
    },
    [account?.address]
  );

  useEffect(() => {
    const buildExistingClient = async () => {
      if (
        !account?.address ||
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
        const addressBytes = encoder.encode(account.address);
        const keyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          keyBytes[i] = addressBytes[i % addressBytes.length];
        }

        const client = await Client.build(account.address, {
          env: "dev",
          dbEncryptionKey: keyBytes,
        });

        setXmtpClient(client);
        logger.debug(
          `[UserScreen] Successfully built XMTP client for address: ${account.address}`
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

    // Only run if wallet is connected
    if (wallet.status === "connected") {
      buildExistingClient();
    }
  }, [account?.address, wallet.status, xmtpClient]);

  const createXmtpClient = useCallback(async () => {
    if (!account?.address || wallet.status !== "connected") {
      logger.debug(
        `[UserScreen] Cannot create XMTP client - address: ${account?.address}, wallet status: ${wallet.status}`
      );
      alert("Wallet not connected");
      return;
    }

    logger.debug(
      `[UserScreen] Creating new XMTP client for address: ${account.address}`
    );
    setIsLoadingClient(true);
    setXmtpClientError(null);
    try {
      const signer: Signer = {
        getAddress: () => Promise.resolve(account.address),
        signMessage: async (message: string) => {
          const signature = await wallet.provider.request({
            method: "personal_sign",
            params: [message, account.address],
          });
          return signature;
        },
        getChainId: () => 8453,
        getBlockNumber: () => 0,
        walletType: () => "SCW",
      };

      const encoder = new TextEncoder();
      const addressBytes = encoder.encode(account.address);
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
        `[UserScreen] Successfully created XMTP client for address: ${account.address}`
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
  }, [account, wallet]);

  const switchChain = useCallback(
    async (provider: PrivyEmbeddedWalletProvider, id: string) => {
      try {
        logger.debug(`[UserScreen] Switching chain to ID: ${id}`);
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: id }],
        });
        logger.debug(`[UserScreen] Successfully switched chain to ID: ${id}`);
        alert(`Chain switched to ${id} successfully`);
      } catch (e) {
        logger.error(`[UserScreen] Error switching chain: ${e}`);
      }
    },
    []
  );

  // Add this useEffect for automatic wallet creation
  useEffect(() => {
    if (wallet.status === "not-created") {
      logger.debug("[UserScreen] Automatically creating wallet");
      wallet.create().catch((error) => {
        logger.error("[UserScreen] Wallet creation failed:", error);
      });
    }
  }, [wallet.status]);

  // Modify existing useEffect to handle auto-client creation
  useEffect(() => {
    const handleAutoClientCreation = async () => {
      if (
        wallet.status === "connected" &&
        !xmtpClient &&
        !isLoadingClient &&
        !isCreatingClient.current
      ) {
        logger.debug(
          "[UserScreen] Automatically creating XMTP client after wallet connection"
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
  }, [wallet.status, xmtpClient, isLoadingClient]);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView>
      <Center>
        <View>
          <Button
            title="Link Passkey"
            onPress={() =>
              linkWithPasskey({
                relyingParty: RELYING_PARTY,
              })
            }
          />
          {/* <View style={{ display: "flex", flexDirection: "column", margin: 10 }}>
        {(["github", "google", "discord", "apple"] as const).map((provider) => (
          <View key={provider}>
            <Button
              title={`Link ${provider}`}
              disabled={oauth.state.status === "loading"}
              onPress={() => oauth.start({ provider })}
            ></Button>
          </View>
        ))}
      </View> */}

          {wallet.status === "needs-recovery" && (
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
            />
          )}

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
                        key={m.verified_at}
                        style={{
                          color: "rgba(0,0,0,0.5)",
                          fontSize: 12,
                          fontStyle: "italic",
                        }}
                      >
                        {m.type}: {toMainIdentifier(m)}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>

              <View>
                {account?.address && (
                  <>
                    <Text style={{ fontWeight: "bold" }}>Embedded Wallet</Text>
                    <Text>{account?.address}</Text>
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

                {wallet.status === "connected" && (
                  <Button
                    title="Sign Message"
                    onPress={() => signMessage(wallet.provider)}
                  />
                )}

                {wallet.status === "connected" && (
                  <>
                    <TextInput
                      value={chainId}
                      onChangeText={setChainId}
                      placeholder="Chain Id"
                    />
                    <Button
                      title="Switch Chain"
                      onPress={() => switchChain(wallet.provider, chainId)}
                    />
                  </>
                )}

                {wallet.status === "needs-recovery" && (
                  <Button
                    title="Recover Wallet"
                    onPress={() => wallet.recover(password)}
                  />
                )}
              </View>

              <View style={{ display: "flex", flexDirection: "column" }}>
                {signedMessages.map((m, i) => (
                  <React.Fragment key={i + m}>
                    <Text
                      style={{
                        color: "rgba(0,0,0,0.5)",
                        fontSize: 12,
                        fontStyle: "italic",
                      }}
                    >
                      {m}
                    </Text>
                    <View
                      style={{
                        marginVertical: 5,
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(0,0,0,0.2)",
                      }}
                    />
                  </React.Fragment>
                ))}
              </View>
              <Button title="Logout" onPress={logout} />
            </View>
          </ScrollView>
        </View>
      </Center>
    </SafeAreaView>
  );
};
