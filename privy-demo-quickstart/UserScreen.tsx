import React, { useState, useCallback } from "react";
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

  const { logout, user } = usePrivy();
  const { linkWithPasskey } = useLinkWithPasskey();
  // const oauth = useOAuthFlow();
  const wallet = useEmbeddedWallet();
  const account = getUserEmbeddedEthereumWallet(user);

  const signMessage = useCallback(
    async (provider: PrivyEmbeddedWalletProvider) => {
      try {
        // const plaintext = `0x0${Date.now()}`;
        const constantPlaintext = "foobar";
        // const message = await provider.request({
        //   method: "personal_sign",
        //   params: [plaintext, account?.address],
        // });
        const signedConstantPlaintext = await provider.request({
          method: "personal_sign",
          params: [constantPlaintext, account?.address],
        });
        // if (message) {
        //   const withPlaintext = `${plaintext}\n${message}`;
        //   setSignedMessages((prev) => prev.concat(withPlaintext));
        // }
        if (signedConstantPlaintext) {
          const withConstantPlaintext = `${constantPlaintext}\n${signedConstantPlaintext}`;
          setSignedMessages((prev) => prev.concat(withConstantPlaintext));
        }
      } catch (e) {
        console.error(e);
      }
    },
    [account?.address]
  );

  const createXmtpClient = useCallback(async () => {
    if (!account?.address || wallet.status !== "connected") {
      alert("Wallet not connected");
      return;
    }

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

      // Create a proper 32-byte encryption key
      const encryptionKey = new Uint8Array(32);
      // Fill with random values
      crypto.getRandomValues(encryptionKey);

      const options: ClientOptions = {
        env: "dev",
        dbEncryptionKey: encryptionKey,
      };

      const client = await Client.create(signer, options);
      setXmtpClient(client);
      alert("XMTP client created successfully!");
    } catch (error) {
      console.error("Error creating XMTP client:", error);
      alert("Failed to create XMTP client");
    }
  }, [account, wallet]);

  const switchChain = useCallback(
    async (provider: PrivyEmbeddedWalletProvider, id: string) => {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: id }],
        });
        alert(`Chain switched to ${id} successfully`);
      } catch (e) {
        console.error(JSON.stringify(e, null, 2));
      }
    },
    []
  );

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

          <Button title="Create XMTP Client" onPress={createXmtpClient} />
          {xmtpClient && (
            <View
              style={{ padding: 10, backgroundColor: "#f0f0f0", margin: 10 }}
            >
              <Text style={{ fontWeight: "bold" }}>XMTP Client Info:</Text>
              <Text>Address: {xmtpClient.address}</Text>
              <Text>Inbox ID: {xmtpClient.inboxId}</Text>
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
