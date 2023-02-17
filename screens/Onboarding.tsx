import { useWalletConnect } from "@walletconnect/react-native-dapp";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Bytes, ethers, Signer } from "ethers";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const connector = useWalletConnect();
  const provider = new WalletConnectProvider({
    infuraId: INFURA_API_KEY,
    connector,
  });

  const autoDisconnect = useRef(true);
  const connectorRef = useRef(connector);
  const clickedSecondSignature = useRef(false);
  const [waitingForSecondSignature, setWaitingForSecondSignature] =
    useState(false);

  useEffect(() => {
    return () => {
      if (connectorRef.current?.connected) {
        connectorRef.current?.killSession();
      }
    };
  }, []);

  useEffect(() => {
    connectorRef.current = connector;
    const disconnect = async () => {
      setWaitingForSecondSignature(false);
      clickedSecondSignature.current = false;
      await connector?.killSession();
      setSigner(undefined);
    };
    const requestSignatures = async () => {
      await provider.enable();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const newSigner = ethersProvider.getSigner();
      const sm = newSigner.signMessage.bind(newSigner);
      (newSigner as any).signaturesCount = 0;
      newSigner.signMessage = async (message: string | Bytes) => {
        const waitForClickSecondSignature = async () => {
          while (!clickedSecondSignature.current) {
            await new Promise((r) => setTimeout(r, 100));
          }
        };
        if ((newSigner as any).signaturesCount === 1) {
          setWaitingForSecondSignature(true);
          await waitForClickSecondSignature();
        }
        const result = await sm(message);
        (newSigner as any).signaturesCount += 1;
        return result;
      };
      const newAddress = await newSigner.getAddress();
      setAddress(newAddress);
      setSigner(newSigner);
    };

    if (connector?.connected) {
      if (autoDisconnect.current) {
        disconnect();
      } else if (!signer) {
        requestSignatures();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  const initXmtpClient = useCallback(async () => {
    if (!signer) {
      return;
    }
    autoDisconnect.current = false;
    const keys = JSON.stringify(
      Array.from(await getXmtpKeysFromSigner(signer))
    );
    saveXmtpKeys(keys);
    sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", { keys });
  }, [signer]);

  const connectWallet = useCallback(async () => {
    autoDisconnect.current = false;
    await connector?.connect();
  }, [connector]);

  return (
    <View style={styles.notifications}>
      <View style={styles.picto}>
        <NotificationsSVG />
      </View>
      <Text style={styles.title}>GM</Text>
      <Text style={styles.p}>
        Connector - {connector ? "true" : "false"} - Connected{" "}
        {connector?.connected ? "true" : "false"} - Signer{" "}
        {signer ? "true" : "false"}
      </Text>
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
          title={waitingForSecondSignature ? "Sign message 2" : "Sign messages"}
          variant="blue"
          style={styles.connect}
          onPress={
            waitingForSecondSignature
              ? () => {
                  clickedSecondSignature.current = true;
                }
              : initXmtpClient
          }
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
