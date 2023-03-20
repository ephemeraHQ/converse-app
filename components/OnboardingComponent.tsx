import { WalletMobileSDKEVMProvider } from "@coinbase/wallet-mobile-sdk/build/WalletMobileSDKEVMProvider";
import { utils } from "@noble/secp256k1";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RenderQrcodeModalProps,
  useWalletConnect,
} from "@walletconnect/react-native-dapp";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Bytes, ethers, Signer, Wallet } from "ethers";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  AppState,
  ColorSchemeName,
  useColorScheme,
} from "react-native";

import Button from "../components/Button";
import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { clearDB } from "../data/db";
import { AppDispatchTypes } from "../data/store/appReducer";
import { AppContext } from "../data/store/context";
import { backgroundColor, textPrimaryColor } from "../utils/colors";
import { saveXmtpKeys } from "../utils/keychain";
import { shortAddress } from "../utils/str";
import { getXmtpKeysFromSigner, isOnXmtp } from "../utils/xmtp";
import Picto from "./Picto/Picto";
import TableView, { TableViewEmoji, TableViewSymbol } from "./TableView";

type Props = {
  walletConnectProps: RenderQrcodeModalProps | undefined;
  setHideModal: (hide: boolean) => void;
  connectToDemoWallet: boolean;
  setConnectToDemoWallet: (value: boolean) => void;
};

export default function OnboardingComponent({
  walletConnectProps,
  setHideModal,
  connectToDemoWallet,
  setConnectToDemoWallet,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    address: "",
    isOnXmtp: false,
    signer: undefined as Signer | undefined,
    isDemo: false,
  });
  const connector = useWalletConnect();
  const provider = new WalletConnectProvider({
    connector,
    rpc: {
      1: "https://cloudflare-eth.com", // Ethereum
      137: "https://matic-mainnet.chainstacklabs.com", // Polygon
      56: "https://endpoints.omniatech.io/v1/bsc/mainnet/public", // BSC
      10: "https://endpoints.omniatech.io/v1/op/mainnet/public", // Optimism
    },
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
      isDemo: false,
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
      waitingForCoinbase.current = true;
      const result: any = await coinbaseProvider.request({
        method: "eth_requestAccounts",
        params: [],
      });
      waitingForCoinbase.current = false;
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
        isDemo: false,
      });
    } catch (e) {
      console.log("Error while connecting to Coinbase:", e);
    }
    waitingForCoinbase.current = false;
    setLoading(false);
  }, [enableDoubleSignature]);

  const generateWallet = useCallback(async () => {
    setLoading(true);
    const signer = new Wallet(utils.randomPrivateKey());
    const address = await signer.getAddress();
    setUser({
      address,
      isOnXmtp: false,
      signer,
      isDemo: true,
    });
  }, []);

  const requestingSignatures = useRef(false);

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
        isDemo: false,
      });
      setLoading(false);
    };

    if (connector?.connected) {
      if (autoDisconnect.current) {
        disconnect();
      } else if (!user.signer && !requestingSignatures.current) {
        requestingSignatures.current = true;
        requestSignatures()
          .then(() => {
            requestingSignatures.current = false;
          })
          .catch((e) => {
            console.log(e);
            requestingSignatures.current = false;
          });
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
      if (user.isDemo) {
        AsyncStorage.setItem("state.app.isDemoAccount", "1");
        dispatch({
          type: AppDispatchTypes.AppSetDemoAccount,
          payload: { isDemoAccount: true },
        });
      }
      await clearDB();
      sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", {
        keys,
        env: config.xmtpEnv,
      });
    } catch (e) {
      setLoading(false);
      console.error(e);
    }
  }, [dispatch, user.isDemo, user.signer]);

  useEffect(() => {
    // Demo accounts can sign immediately
    if (user.isDemo) {
      initXmtpClient();
    }
  }, [initXmtpClient, user.isDemo]);

  const directConnectToWallet = useRef("");
  const appState = useRef(AppState.currentState);
  const waitingForCoinbase = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          try {
            (connector as any)?._qrcodeModal?.close();
          } catch (e) {
            console.log(e);
          }
          if (waitingForCoinbase.current) {
            waitingForCoinbase.current = false;
            setLoading(false);
          }
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
      } catch (e: any) {
        console.log("User did not connect to WC", e);
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
        walletConnectProps
          .connectToWalletService(walletService, walletConnectProps?.uri)
          .catch((e: any) => {
            // Wallet is probably not installed!
            console.log(e);
            setLoading(false);
          });
      }
    }
  }, [walletConnectProps]);

  useEffect(() => {
    if (connectToDemoWallet) {
      setHideModal(true);
      generateWallet();
      setConnectToDemoWallet(false);
    }
  }, [
    connectToDemoWallet,
    generateWallet,
    setConnectToDemoWallet,
    setHideModal,
  ]);

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
        <Picto picto={sfSymbol} style={{ marginBottom: 48 }} size={43} />
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
                id: "ledger",
                picto: <TableViewEmoji emoji="🔲" />,
                title: "Connect Ledger Wallet",
                action: () => {
                  connectWallet("Ledger Live");
                },
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
