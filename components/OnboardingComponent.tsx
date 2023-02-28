import { WalletMobileSDKEVMProvider } from "@coinbase/wallet-mobile-sdk/build/WalletMobileSDKEVMProvider";
import {
  RenderQrcodeModalProps,
  useWalletConnect,
} from "@walletconnect/react-native-dapp";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Bytes, ethers, Signer } from "ethers";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  PlatformColor,
  ActivityIndicator,
  AppState,
  ColorSchemeName,
  useColorScheme,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import Button from "../components/Button";
import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { backgroundColor, textPrimaryColor } from "../utils/colors";
import { saveXmtpKeys } from "../utils/keychain";
import { shortAddress } from "../utils/str";
import { getXmtpKeysFromSigner, isOnXmtp } from "../utils/xmtp";
import TableView, { TableViewEmoji, TableViewSymbol } from "./TableView";

type Props = {
  walletConnectProps: RenderQrcodeModalProps | undefined;
  setHideModal: (hide: boolean) => void;
};

export default function OnboardingComponent({
  walletConnectProps,
  setHideModal,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
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

  const enableDoubleSignature = useCallback((signer: Signer) => {
    const sm = signer.signMessage.bind(signer);
    (signer as any).signaturesCount = 0;
    signer.signMessage = async (message: string | Bytes) => {
      const waitForClickSecondSignature = async () => {
        while (!clickedSecondSignature.current) {
          await new Promise((r) => setTimeout(r, 100));
        }
      };
      if ((signer as any).signaturesCount === 1) {
        setWaitingForSecondSignature(true);
        await waitForClickSecondSignature();
      }
      const result = await sm(message);
      (signer as any).signaturesCount += 1;
      return result;
    };
  }, []);

  const connectCoinbaseWallet = useCallback(async () => {
    setLoading(true);
    try {
      const coinbaseProvider = new WalletMobileSDKEVMProvider({
        jsonRpcUrl: `https://mainnet.infura.io/v3/${config.infuraApiKey}`,
      });
      const result: any = await coinbaseProvider.request({
        method: "eth_requestAccounts",
        params: [],
      });
      const address = result[0];
      const isOnNetwork = await isOnXmtp(address);
      const web3Provider = new ethers.providers.Web3Provider(
        coinbaseProvider as any
      );
      const signer = web3Provider.getSigner();
      enableDoubleSignature(signer);
      setUser({
        address,
        isOnXmtp: isOnNetwork,
        signer,
      });
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  }, [enableDoubleSignature]);

  useEffect(() => {
    connectorRef.current = connector;
    const requestSignatures = async () => {
      await provider.enable();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const newSigner = ethersProvider.getSigner();
      enableDoubleSignature(newSigner);
      const newAddress = await newSigner.getAddress();
      const isOnNetwork = await isOnXmtp(newAddress);
      setUser({
        address: newAddress,
        isOnXmtp: isOnNetwork,
        signer: newSigner,
      });
      console.log("setting loading false 12");
      setLoading(false);
    };

    if (connector?.connected) {
      if (autoDisconnect.current) {
        disconnect();
      } else if (!user.signer) {
        requestSignatures();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector, enableDoubleSignature]);

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

  const directConnectToWallet = useRef("");
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          (connector as any)?._qrcodeModal?.close();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [connector]);

  const connectWallet = useCallback(
    async (walletName: string) => {
      directConnectToWallet.current = walletName;
      autoDisconnect.current = false;
      setLoading(true);
      setHideModal(!!walletName);
      try {
        await connector?.connect();
      } catch {
        console.log("User did not connect to WC");
        setLoading(false);
      }
      setHideModal(false);
    },
    [connector, setHideModal]
  );

  useEffect(() => {
    if (directConnectToWallet.current && walletConnectProps?.uri) {
      const connectTo = directConnectToWallet.current;
      directConnectToWallet.current = "";
      const walletService = walletConnectProps?.walletServices.find(
        (w) => w.name === connectTo
      );
      if (walletService) {
        walletConnectProps.connectToWalletService(
          walletService,
          walletConnectProps?.uri
        );
      }
    }
  }, [walletConnectProps]);

  let sfSymbol = "message.circle.fill";
  let title = "GM";
  let text = `Converse connects web3 identities with each other. Connect your wallet to start chatting.`;
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
    <View style={styles.onboarding}>
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
        <View style={styles.walletSelectorContainer}>
          <TableView
            items={[
              {
                id: "metamask",
                picto: <TableViewEmoji emoji="🦊" />,
                title: "Connect Metamask",
                action: () => {
                  connectWallet("MetaMask");
                },
              },
              {
                id: "rainbow",
                picto: <TableViewEmoji emoji="🌈" />,
                title: "Connect Rainbow",
                action: () => {
                  connectWallet("Rainbow");
                },
              },
              {
                id: "coinbase",
                picto: <TableViewEmoji emoji="🔵" />,
                title: "Connect Coinbase Wallet",
                action: connectCoinbaseWallet,
              },
              {
                id: "walletconnect",
                picto: <TableViewSymbol symbol="plus" />,
                title: "Connect another wallet",
                action: () => {
                  connectWallet("");
                },
              },
            ]}
          />
        </View>
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

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    onboarding: {
      flex: 1,
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
    },
    picto: {
      marginTop: 124,
      marginBottom: 50,
    },
    title: {
      fontWeight: "700",
      fontSize: 34,
      color: textPrimaryColor(colorScheme),
    },
    p: {
      fontSize: 17,
      marginLeft: 32,
      marginRight: 32,
      textAlign: "center",
      marginTop: 21,
      marginBottom: "auto",
      color: textPrimaryColor(colorScheme),
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
    walletSelectorContainer: {
      width: "100%",
      marginBottom: 97,
    },
  });
