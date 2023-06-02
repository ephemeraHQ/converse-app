import { WalletMobileSDKEVMProvider } from "@coinbase/wallet-mobile-sdk/build/WalletMobileSDKEVMProvider";
import {
  RenderQrcodeModalProps,
  useWalletConnect,
} from "@walletconnect/react-native-dapp";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers, Signer, Wallet } from "ethers";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  AppState,
  ColorSchemeName,
  useColorScheme,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Dimensions,
} from "react-native";

import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { clearDB } from "../data/db";
import {
  backgroundColor,
  textInputStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getPrivateKeyFromMnemonic, validateMnemonic } from "../utils/eth";
import { saveXmtpKeys } from "../utils/keychain";
import { shortAddress } from "../utils/str";
import { getXmtpKeysFromSigner, isOnXmtp } from "../utils/xmtp/client";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";
import Button from "./Button/Button";
import Picto from "./Picto/Picto";
import TableView, { TableViewEmoji, TableViewPicto } from "./TableView";

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
  const [connectWithSeedPhrase, setConnectWithSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [keyboardVerticalOffset, setKeyboardVerticalOffset] = useState(0);
  const [user, setUser] = useState({
    address: "",
    isOnXmtp: false,
    signer: undefined as Signer | undefined,
    isSeedPhrase: false,
  });
  const connector = useWalletConnect();
  const provider = new WalletConnectProvider({
    connector,
    rpc: {
      1: "https://cloudflare-eth.com", // Ethereum
      137: "https://matic-mainnet.chainstacklabs.com", // Polygon
      56: "https://endpoints.omniatech.io/v1/bsc/mainnet/public", // BSC
      10: "https://endpoints.omniatech.io/v1/op/mainnet/public", // Optimism
      42161: "https://arb1.arbitrum.io/rpc", // Arbitrum
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
      isSeedPhrase: false,
    });
    setLoading(false);
    if (connector?.connected) {
      await connector?.killSession();
    }
  };

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
      setUser({
        address,
        isOnXmtp: isOnNetwork,
        signer,
        isSeedPhrase: false,
      });
    } catch (e) {
      console.log("Error while connecting to Coinbase:", e);
    }
    waitingForCoinbase.current = false;
    setLoading(false);
  }, []);

  const getSignerFromSeedPhrase = useCallback(async (mnemonic: string) => {
    let rightMnemonic = mnemonic;
    try {
      rightMnemonic = validateMnemonic(mnemonic);
    } catch (e) {
      console.log(e);
      Alert.alert("This seed phrase is invalid. Please try again");
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      try {
        const privateKey = await getPrivateKeyFromMnemonic(rightMnemonic);
        const signer = new Wallet(privateKey);
        const address = await signer.getAddress();
        setUser({
          address,
          isOnXmtp: false,
          signer,
          isSeedPhrase: true,
        });
      } catch (e) {
        setLoading(false);
        Alert.alert("This seed phrase is invalid. Please try again");
      }
    }, 10);
  }, []);

  const requestingSignatures = useRef(false);

  useEffect(() => {
    connectorRef.current = connector;
    const requestSignatures = async () => {
      await provider.enable();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const newSigner = ethersProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      const isOnNetwork = await isOnXmtp(newAddress);
      setUser({
        address: newAddress,
        isOnXmtp: isOnNetwork,
        signer: newSigner,
        isSeedPhrase: false,
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
  }, [connector]);

  const waitingForSecondSignatureRef = useRef(waitingForSecondSignature);
  useEffect(() => {
    waitingForSecondSignatureRef.current = waitingForSecondSignature;
  }, [waitingForSecondSignature]);

  const initXmtpClient = useCallback(async () => {
    if (!user.signer) {
      return;
    }
    autoDisconnect.current = false;
    try {
      const keys = JSON.stringify(
        Array.from(
          await getXmtpKeysFromSigner(
            user.signer,
            async () => {
              // Before calling "create" signature
              setWaitingForSecondSignature(true);
              clickedSecondSignature.current = false;
            },
            async () => {
              // Before calling "enable" signature
              const waitForClickSecondSignature = async () => {
                while (!clickedSecondSignature.current) {
                  await new Promise((r) => setTimeout(r, 100));
                }
              };

              if (waitingForSecondSignatureRef.current) {
                setLoading(false);
                await waitForClickSecondSignature();
                setWaitingForSecondSignature(false);
              }
            }
          )
        )
      );
      saveXmtpKeys(keys);

      await clearDB();
      sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", {
        keys,
        env: config.xmtpEnv,
      });
    } catch (e) {
      setLoading(false);
      clickedSecondSignature.current = false;
      setWaitingForSecondSignature(false);
      console.error(e);
    }
  }, [user.signer]);

  useEffect(() => {
    // Demo accounts can sign immediately
    if (user.isSeedPhrase) {
      initXmtpClient();
    }
  }, [initXmtpClient, user.isSeedPhrase]);

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

  let picto = "message.circle.fill";
  let title = "GM";
  let text = `Converse connects web3 identities with each other. Connect your wallet to start chatting.`;
  const termsAndConditions = (
    <Text style={styles.terms}>
      By signing in you agree to our{" "}
      <Text
        style={styles.link}
        onPress={() =>
          Linking.openURL(
            "https://converseapp.notion.site/Terms-and-conditions-004036ad55044aba888cc83e21b8cbdb"
          )
        }
      >
        terms and conditions.
      </Text>
    </Text>
  );
  let subtitle = null;
  if (user.address && !user.isSeedPhrase) {
    picto = "signature";
    title = "Sign";

    if (user.isOnXmtp) {
      text =
        "Second and last step: please sign with your wallet so that we make sure you own it.";
      subtitle = termsAndConditions;
    } else {
      if (waitingForSecondSignature) {
        title = "Sign (2/2)";
        text =
          "Please sign one last time to access Converse and start chatting.";
      } else {
        title = "Sign (1/2)";
        text =
          "This first signature will enable your wallet to send and receive messages.";
        subtitle = termsAndConditions;
      }
    }
  } else if (connectWithSeedPhrase || user.isSeedPhrase) {
    title = "Seed phrase";
    text =
      "Enter your wallet's seed phrase. It will be used to connect to the XMTP network and it will not be stored anywhere.";
    picto = "key.horizontal";
  }

  const tableViewPaddingHorizontal = Platform.OS === "android" ? 33 : 0;
  const scrollViewRef = useRef<ScrollView | null>(null);
  const textInputRef = useRef<TextInput | null>(null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      enabled={Dimensions.get("window").height < 850}
      behavior={Platform.OS === "ios" ? "position" : "height"}
      keyboardVerticalOffset={
        Platform.OS === "ios" ? keyboardVerticalOffset : 0
      }
    >
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={styles.onboardingContent}
        ref={scrollViewRef}
      >
        <Picto
          picto={picto}
          size={Platform.OS === "android" ? 80 : 43}
          style={styles.picto}
        />
        {!loading && (
          <>
            <Text style={styles.title}>{title}</Text>
            <View
              style={{
                marginBottom: connectWithSeedPhrase ? undefined : "auto",
              }}
            >
              {text && <Text style={styles.p}>{text}</Text>}
              {subtitle}
            </View>
          </>
        )}

        {loading && (
          <ActivityIndicator size="large" style={{ marginBottom: "auto" }} />
        )}

        {!user.signer && !loading && !connectWithSeedPhrase && (
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
                  paddingHorizontal: tableViewPaddingHorizontal,
                },
                {
                  id: "rainbow",
                  picto: <TableViewEmoji emoji="🌈" />,
                  title: "Connect Rainbow",
                  action: () => {
                    connectWallet("Rainbow");
                  },
                  paddingHorizontal: tableViewPaddingHorizontal,
                },
                {
                  id: "coinbase",
                  picto: <TableViewEmoji emoji="🔵" />,
                  title: "Connect Coinbase Wallet",
                  action: connectCoinbaseWallet,
                  paddingHorizontal: tableViewPaddingHorizontal,
                },
                {
                  id: "seedphrase",
                  picto: <TableViewEmoji emoji="🔑" />,
                  title: "Connect with seed phrase",
                  action: () => {
                    setConnectWithSeedPhrase(true);
                  },
                  paddingHorizontal: tableViewPaddingHorizontal,
                },
                {
                  id: "walletconnect",
                  picto:
                    Platform.OS === "android" ? (
                      <TableViewEmoji emoji="＋" />
                    ) : (
                      <TableViewPicto symbol="plus" />
                    ),
                  title: "Connect another wallet",
                  action: () => {
                    connectWallet("");
                  },
                  paddingHorizontal: tableViewPaddingHorizontal,
                },
              ]}
            />
          </View>
        )}
        {!user.signer && !loading && connectWithSeedPhrase && (
          <>
            <View style={styles.seedPhraseContainer}>
              <TextInput
                multiline
                textAlignVertical="top"
                style={[
                  textInputStyle(colorScheme),
                  { width: "100%", height: "100%" },
                ]}
                placeholder="Enter your seed phrase"
                placeholderTextColor={textSecondaryColor(colorScheme)}
                onChangeText={(content) => {
                  setSeedPhrase(content.replace(/\n/g, " "));
                }}
                onFocus={() => {
                  setSeedPhrase(seedPhrase.trim());
                }}
                value={seedPhrase}
                ref={(r) => {
                  textInputRef.current = r;
                  r?.measure((x, y, width, height, pageX, pageY) => {
                    setKeyboardVerticalOffset(-y - height - 80);
                  });
                }}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === "Enter") {
                    textInputRef.current?.blur();
                  }
                }}
              />
            </View>
            <View style={{ marginBottom: 20 }}>{termsAndConditions}</View>

            <Button
              title="Connect"
              variant="primary"
              style={[styles.sign, { marginTop: "auto" }]}
              onPress={() => {
                if (!seedPhrase || seedPhrase.trim().length === 0) return;
                getSignerFromSeedPhrase(seedPhrase.trim());
              }}
            />

            <Button
              title="Back to home screen"
              style={styles.logout}
              variant="text"
              textStyle={{ fontWeight: "600" }}
              onPress={() => {
                setConnectWithSeedPhrase(false);
                setSeedPhrase("");
              }}
            />
          </>
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
                variant="primary"
                style={styles.sign}
                onPress={() => {
                  if (waitingForSecondSignature) {
                    setLoading(true);
                    clickedSecondSignature.current = true;
                  } else {
                    setLoading(true);
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    onboardingContent: {
      minHeight: "100%",
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
    },
    picto: {
      ...Platform.select({
        default: {
          marginTop: 124,
          marginBottom: 98,
        },
        android: {
          marginTop: 165,
          marginBottom: 61,
        },
      }),
    },
    title: Platform.select({
      default: {
        fontWeight: "700",
        fontSize: 34,
        color: textPrimaryColor(colorScheme),
      },
      android: {
        fontSize: 24,
        color: textPrimaryColor(colorScheme),
      },
    }),
    p: {
      textAlign: "center",
      marginTop: 21,
      marginLeft: 32,
      marginRight: 32,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
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
      marginTop: 50,
      marginBottom: 97,
    },
    terms: {
      textAlign: "center",
      marginLeft: 32,
      marginRight: 32,
      marginTop: 30,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
    link: {
      textDecorationLine: "underline",
    },
    seedPhraseContainer: {
      width: "100%",
      paddingRight: 25,
      paddingLeft: 25,
      height: 130,
      marginTop: 38,
    },
    seedPhrase: {
      width: "100%",
      height: "100%",
    },
  });
