import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDisconnect, useSigner } from "@thirdweb-dev/react-native";
import { Wallet } from "ethers";
import * as Linking from "expo-linking";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  ColorSchemeName,
  useColorScheme,
  Platform,
  AppState,
} from "react-native";

import Button from "../components/Button/Button";
import DesktopConnect from "../components/Onboarding/DesktopConnect";
import OnboardingComponent from "../components/Onboarding/OnboardingComponent";
import SeedPhraseConnect, {
  getSignerFromSeedPhrase,
} from "../components/Onboarding/SeedPhraseConnect";
import WalletSelector from "../components/Onboarding/WalletSelector";
import { resetLocalXmtpState } from "../components/XmtpState";
import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { clearDB } from "../data/db";
import { AppContext } from "../data/store/context";
import { RecommendationsDispatchTypes } from "../data/store/recommendationsReducer";
import { textPrimaryColor, textSecondaryColor } from "../utils/colors";
import { saveXmtpKeys } from "../utils/keychain";
import { shortAddress } from "../utils/str";
import { getXmtpKeysFromSigner, isOnXmtp } from "../utils/xmtp/client";

export default function OnboardingScreen() {
  const { state, dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const [isLoading, setLoading] = useState(false);
  const [connectWithSeedPhrase, setConnectWithSeedPhrase] = useState(false);
  const [connectWithDesktop, setConnectWithDesktop] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");

  const [keyboardVerticalOffset, setKeyboardVerticalOffset] = useState(0);

  const [user, setUser] = useState({
    address: "",
    isOnXmtp: false,
    seedPhraseSigner: undefined as Wallet | undefined,
  });

  const _thirdwebSigner = useSigner();
  const [thirdwebSigner, setThirdwebSigner] = useState(_thirdwebSigner);
  useEffect(() => {
    setThirdwebSigner(_thirdwebSigner);
  }, [_thirdwebSigner]);
  const signerRef = useRef(user.seedPhraseSigner || thirdwebSigner);
  useEffect(() => {
    signerRef.current = user.seedPhraseSigner || thirdwebSigner;
  }, [thirdwebSigner, user.seedPhraseSigner]);

  const disconnectWallet = useDisconnect();

  const loading = isLoading || (thirdwebSigner && !user.address);

  const clickedSecondSignature = useRef(false);
  const [waitingForSecondSignature, setWaitingForSecondSignature] =
    useState(false);

  const disconnect = useCallback(
    async (resetLoading = true) => {
      setWaitingForSecondSignature(false);
      clickedSecondSignature.current = false;
      setUser({
        address: "",
        isOnXmtp: false,
        seedPhraseSigner: undefined,
      });
      setThirdwebSigner(undefined);
      if (resetLoading) {
        setLoading(false);
      }
      await disconnectWallet();
      const storageKeys = await AsyncStorage.getAllKeys();
      const wcKeys = storageKeys.filter((k) => k.startsWith("wc@2:"));
      await AsyncStorage.multiRemove(wcKeys);
    },
    [disconnectWallet]
  );

  const loginWithSeedPhrase = useCallback(async (mnemonic: string) => {
    setLoading(true);
    setTimeout(async () => {
      const seedPhraseSigner = await getSignerFromSeedPhrase(mnemonic);
      if (!seedPhraseSigner) {
        setLoading(false);
        return;
      }
      const address = await seedPhraseSigner.getAddress();
      setUser({
        address,
        isOnXmtp: false,
        seedPhraseSigner,
      });
    }, 10);
  }, []);

  const requestingSignatures = useRef(false);

  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          setTimeout(() => {
            // After we come back to the app, if we still don't
            // have a signer after 2 secs, let's reset state
            if (!signerRef.current) {
              console.log("Still not signer after 1.5 sec");
              disconnect();
            }
          }, 1500);
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [disconnect]);

  useEffect(() => {
    const requestSignatures = async () => {
      if (!thirdwebSigner || requestingSignatures.current) return;
      requestingSignatures.current = true;
      try {
        const newAddress = await thirdwebSigner.getAddress();
        const isOnNetwork = await isOnXmtp(newAddress);
        setUser({
          address: newAddress,
          isOnXmtp: isOnNetwork,
          seedPhraseSigner: undefined,
        });
        setLoading(false);
      } catch (e) {
        console.log(e);
      }
      requestingSignatures.current = false;
    };

    requestSignatures();
  }, [thirdwebSigner]);

  const waitingForSecondSignatureRef = useRef(waitingForSecondSignature);
  useEffect(() => {
    waitingForSecondSignatureRef.current = waitingForSecondSignature;
  }, [waitingForSecondSignature]);

  const initXmtpClient = useCallback(async () => {
    const signer = user.seedPhraseSigner || thirdwebSigner;
    if (!signer) {
      return;
    }
    try {
      const keys = JSON.stringify(
        Array.from(
          await getXmtpKeysFromSigner(
            signer,
            async () => {
              if (user.seedPhraseSigner) return;
              // Before calling "create" signature
              setWaitingForSecondSignature(true);
              clickedSecondSignature.current = false;
            },
            async () => {
              if (user.seedPhraseSigner) return;
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
      resetLocalXmtpState();
      dispatch({ type: RecommendationsDispatchTypes.ResetRecommendations });
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
  }, [dispatch, thirdwebSigner, user.seedPhraseSigner]);

  useEffect(() => {
    // Seed phrase account can sign immediately
    if (user.seedPhraseSigner) {
      initXmtpClient();
    }
  }, [initXmtpClient, user.seedPhraseSigner]);

  let picto = "message.circle.fill";
  let title = "GM";
  let text:
    | string
    | JSX.Element = `Converse connects web3 identities with each other. Connect your wallet to start chatting.`;
  const termsAndConditions = (
    <>
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
    </>
  );
  let primaryButtonText: string | undefined = undefined;
  let primaryButtonAction = () => {};
  let backButtonText: string | undefined = undefined;
  let backButtonAction = () => {};
  if (user.address && !user.seedPhraseSigner) {
    picto = "signature";
    title = "Sign";

    if (user.isOnXmtp) {
      text = (
        <>
          <Text>
            Second and last step: please sign with your wallet so that we make
            sure you own it.{"\n\n"}
          </Text>
          {termsAndConditions}
        </>
      );
    } else {
      if (
        (waitingForSecondSignature && !loading) ||
        clickedSecondSignature.current
      ) {
        title = "Sign (2/2)";
        text =
          "Please sign one last time to access Converse and start chatting.";
      } else {
        title = "Sign (1/2)";
        text = (
          <>
            <Text>
              This first signature will enable your wallet to send and receive
              messages.{"\n\n"}
            </Text>
            {termsAndConditions}
          </>
        );
      }
    }
  } else if (connectWithSeedPhrase || user.seedPhraseSigner) {
    title = "Seed phrase";
    text =
      "Enter your wallet's seed phrase. It will be used to connect to the XMTP network and it will not be stored anywhere.";
    picto = "key.horizontal";
    primaryButtonText = "Connect";
    primaryButtonAction = () => {
      if (!seedPhrase || seedPhrase.trim().length === 0) return;
      loginWithSeedPhrase(seedPhrase.trim());
    };
  } else if (connectWithDesktop) {
    title = "Desktop Connect";
    picto = "lock.open.laptopcomputer";
    text = (
      <Text>
        Go to{" "}
        <Text style={{ fontWeight: "700" }}>
          {config.websiteDomain}/connect
        </Text>{" "}
        and follow instructions.
      </Text>
    );
  }

  if (state.app.desktopConnectSessionId) {
    return <DesktopConnect />;
  }

  let onboardingContent: React.ReactNode;

  if (
    !thirdwebSigner &&
    !connectWithSeedPhrase &&
    !connectWithDesktop &&
    !loading
  ) {
    onboardingContent = (
      <WalletSelector
        setConnectWithDesktop={setConnectWithDesktop}
        setConnectWithSeedPhrase={setConnectWithSeedPhrase}
        disconnect={disconnect}
        setLoading={setLoading}
      />
    );
  } else if (!thirdwebSigner && !loading && connectWithSeedPhrase) {
    backButtonText = "Back to home screen";
    backButtonAction = () => {
      setConnectWithSeedPhrase(false);
    };
    onboardingContent = (
      <SeedPhraseConnect
        seedPhrase={seedPhrase}
        setSeedPhrase={setSeedPhrase}
        setKeyboardVerticalOffset={setKeyboardVerticalOffset}
      />
    );
  } else if (!thirdwebSigner && !loading && connectWithDesktop) {
    onboardingContent = (
      <>
        <Button
          title="Back to home screen"
          style={[styles.logout, { marginTop: "auto" }]}
          variant="text"
          textStyle={{ fontWeight: "600" }}
          onPress={() => {
            setConnectWithDesktop(false);
          }}
        />
      </>
    );
  } else if (thirdwebSigner && user.address) {
    backButtonText = `Log out from ${shortAddress(user.address)}`;
    backButtonAction = disconnect;
    primaryButtonText = "Sign";
    primaryButtonAction = () => {
      if (waitingForSecondSignature) {
        setLoading(true);
        clickedSecondSignature.current = true;
      } else {
        setLoading(true);
        initXmtpClient();
      }
    };
  }

  return (
    <OnboardingComponent
      loading={loading}
      title={title}
      subtitle={loading ? "" : text}
      picto={picto}
      view={onboardingContent}
      backButtonText={backButtonText}
      backButtonAction={backButtonAction}
      keyboardVerticalOffset={keyboardVerticalOffset}
      primaryButtonText={loading ? "" : primaryButtonText}
      primaryButtonAction={primaryButtonAction}
    />
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    sign: {
      marginBottom: 21,
      marginTop: 21,
    },
    logout: {
      marginBottom: 54,
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
  });
