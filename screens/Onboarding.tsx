import { useWalletConnect } from "@walletconnect/react-native-dapp";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Bytes, ethers, Signer } from "ethers";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  PlatformColor,
  ActivityIndicator,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import Button from "../components/Button";
import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { saveXmtpKeys } from "../utils/keychain";
import { shortAddress } from "../utils/str";
import { getXmtpKeysFromSigner, isOnXmtp } from "../utils/xmtp";

export default function OnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    address: "",
    isOnXmtp: false,
    signer: undefined as Signer | undefined,
  });
  const connector = useWalletConnect();
  const provider = new WalletConnectProvider({
    infuraId: config.infuraApiKey,
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

  const disconnect = async () => {
    setWaitingForSecondSignature(false);
    clickedSecondSignature.current = false;
    setUser({
      address: "",
      isOnXmtp: false,
      signer: undefined,
    });
    setLoading(false);
    if (connector?.connected) {
      await connector?.killSession();
    }
  };

  useEffect(() => {
    connectorRef.current = connector;
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
      const isOnNetwork = await isOnXmtp(newAddress);
      setUser({
        address: newAddress,
        isOnXmtp: isOnNetwork,
        signer: newSigner,
      });
    };

    if (connector?.connected) {
      if (autoDisconnect.current) {
        disconnect();
      } else if (!user.signer) {
        requestSignatures();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  const initXmtpClient = useCallback(async () => {
    if (!user.signer) {
      return;
    }
    autoDisconnect.current = false;
    try {
      const keys = JSON.stringify(
        Array.from(await getXmtpKeysFromSigner(user.signer))
      );
      saveXmtpKeys(keys);
      sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", { keys });
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  }, [user]);

  const connectWallet = useCallback(async () => {
    autoDisconnect.current = false;
    setLoading(true);
    try {
      await connector?.connect();
    } catch {
      console.log("User did not connect to WC");
    }
    setLoading(false);
  }, [connector]);

  let sfSymbol = "message.circle.fill";
  let title = "GM";
  let text = `Converse connects web3 identities with each other. We recommend that you use your "public" wallet with our app.`;
  if (user.address) {
    sfSymbol = "signature";
    title = "Sign";

    if (user.isOnXmtp) {
      text =
        "Second and last step: please sign with your wallet so that we make sure you own it.";
    } else {
      if (waitingForSecondSignature) {
        title = "Sign (2/2)";
        text =
          "Please sign one last time to access Converse and start chatting.";
      } else {
        title = "Sign (1/2)";
        text =
          "This first signature will enable your wallet to send and receive messages.";
      }
    }
  }

  return (
    <View style={styles.notifications}>
      <View style={styles.picto}>
        <SFSymbol
          name={sfSymbol}
          weight="regular"
          scale="large"
          color={PlatformColor("systemBlue")}
          size={43}
          resizeMode="center"
          style={{ marginBottom: 48 }}
        />
      </View>
      {!loading && (
        <>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.p}>{text}</Text>
        </>
      )}

      {loading && (
        <ActivityIndicator size="large" style={{ marginBottom: "auto" }} />
      )}

      {!user.signer && !loading && (
        <Button
          title="Connect Wallet"
          variant="blue"
          style={styles.connect}
          onPress={connectWallet}
        />
      )}
      {user.signer && (
        <>
          {!loading && (
            <Button
              title={
                waitingForSecondSignature
                  ? "Sign (2/2)"
                  : user.isOnXmtp
                  ? "Sign"
                  : "Sign (1/2)"
              }
              variant="blue"
              style={styles.sign}
              onPress={() => {
                if (waitingForSecondSignature) {
                  setLoading(true);
                  clickedSecondSignature.current = true;
                } else {
                  if (user.isOnXmtp) {
                    setLoading(true);
                  }
                  initXmtpClient();
                }
              }}
            />
          )}

          <Button
            title={`Log out from ${shortAddress(user.address)}`}
            style={styles.logout}
            variant="text"
            textStyle={{ fontWeight: "600" }}
            onPress={disconnect}
          />
        </>
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
  sign: {
    marginBottom: 21,
    marginTop: 21,
  },
  logout: {
    marginBottom: 54,
  },
});
