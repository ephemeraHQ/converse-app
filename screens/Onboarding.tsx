import { useWalletConnect } from "@walletconnect/react-native-dapp";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers, Signer } from "ethers";
import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";

import Button from "../components/Button";
import { sendMessageToWebview } from "../components/XmtpWebview";
import NotificationsSVG from "../components/svgs/notifications";
import { saveXmtpKeys } from "../utils/keychain";
import { getXmtpKeysFromSigner } from "../utils/xmtp";
export const INFURA_API_KEY = "2bf116f1cc724c5ab9eec605ca8440e1";

export default function OnboardingScreen() {
  // const [client, setClient] = useState<Client>();
  const [signer, setSigner] = useState<Signer>();
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const connector = useWalletConnect();
  const provider = new WalletConnectProvider({
    infuraId: INFURA_API_KEY,
    connector,
  });

  console.log("connector", connector?.connected);

  useEffect(() => {
    if (connector?.connected && !signer) {
      const requestSignatures = async () => {
        await provider.enable();
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const newSigner = ethersProvider.getSigner();
        const newAddress = await newSigner.getAddress();
        setAddress(newAddress);
        setSigner(newSigner);
      };
      requestSignatures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  const initXmtpClient = useCallback(async () => {
    if (!signer) {
      setIsLoading(false);
      return;
    }
    const keys = JSON.stringify(
      Array.from(await getXmtpKeysFromSigner(signer))
    );
    saveXmtpKeys(keys);
    sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", { keys });
    setIsLoading(false);
  }, [signer]);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    await connector?.connect();
  }, [connector]);

  return (
    <View style={styles.notifications}>
      <View style={styles.picto}>
        <NotificationsSVG />
      </View>
      <Text style={styles.title}>GM</Text>
      <Text style={styles.p}>YOYO some text</Text>
      {!signer && (
        <Button
          title="Connect Wallet"
          variant="blue"
          style={styles.connect}
          onPress={connectWallet}
        />
      )}
      {signer && (
        <Button
          title="Sign messages"
          variant="blue"
          style={styles.connect}
          onPress={initXmtpClient}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notifications: {
    flex: 1,
    alignItems: "center",
  },
  picto: {
    marginTop: 124,
    marginBottom: 50,
  },
  title: {
    fontWeight: "700",
    fontSize: 34,
  },
  p: {
    fontSize: 17,
    marginLeft: 32,
    marginRight: 32,
    textAlign: "center",
    marginTop: 21,
    marginBottom: "auto",
  },
  connect: {
    marginBottom: 54,
    marginTop: 21,
  },
});
