import { utils } from "@noble/secp256k1";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDisconnect, useSigner } from "@thirdweb-dev/react-native";
import { Signer } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  useColorScheme,
  Platform,
  AppState,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../components/Button/Button";
import DesktopConnect from "../components/Onboarding/DesktopConnect";
import OnboardingComponent from "../components/Onboarding/OnboardingComponent";
import PrivyConnect from "../components/Onboarding/PrivyConnect";
import SeedPhraseConnect, {
  getSignerFromSeedPhrase,
} from "../components/Onboarding/SeedPhraseConnect";
import WalletSelector from "../components/Onboarding/WalletSelector";
import config from "../config";
import { initDb } from "../data/db";
import {
  useAccountsStore,
  getSettingsStore,
  getAccountsList,
} from "../data/store/accountsStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { textPrimaryColor, textSecondaryColor } from "../utils/colors";
import { saveXmtpKey } from "../utils/keychain";
import { waitForLogoutTasksDone } from "../utils/logout";
import { pick } from "../utils/objects";
import { shortAddress } from "../utils/str";
import { getXmtpKeysFromSigner, isOnXmtp } from "../utils/xmtpJS/client";
import { getXmtpClient } from "../utils/xmtpRN/client";

export type ConnectionMethod = "wallet" | "phone" | "desktop" | "seedPhrase";

export default function OnboardingScreen() {
  const { desktopConnectSessionId, addingNewAccount, setAddingNewAccount } =
    useOnboardingStore((s) =>
      pick(s, [
        "desktopConnectSessionId",
        "addingNewAccount",
        "setAddingNewAccount",
      ])
    );
  const styles = useStyles();

  const [isLoading, setLoading] = useState(false);
  const [connectionMethod, setConnectionMethod] =
    useState<ConnectionMethod>("wallet");

  const [seedPhrase, setSeedPhrase] = useState("");

  const [keyboardVerticalOffset, setKeyboardVerticalOffset] = useState(0);

  const [user, setUser] = useState({
    address: "",
    isOnXmtp: false,
    isEphemeral: false,
    seedPhraseSigner: undefined as Wallet | undefined,
    otherSigner: undefined as Signer | undefined,
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

  const loading =
    isLoading || ((thirdwebSigner || user.otherSigner) && !user.address);

  const clickedSecondSignature = useRef(false);
  const [waitingForSecondSignature, setWaitingForSecondSignature] =
    useState(false);
  const initiatingClientFor = useRef<string | undefined>(undefined);

  const disconnect = useCallback(
    async (resetLoading = true) => {
      setWaitingForSecondSignature(false);
      clickedSecondSignature.current = false;
      initiatingClientFor.current = undefined;
      setUser({
        address: "",
        isEphemeral: false,
        isOnXmtp: false,
        seedPhraseSigner: undefined,
        otherSigner: undefined,
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
        isEphemeral: false,
        isOnXmtp: false,
        seedPhraseSigner,
        otherSigner: undefined,
      });
    }, 10);
  }, []);

  const setSigner = useCallback((signer: Signer) => {
    setUser((u) => ({
      address: "",
      isEphemeral: false,
      isOnXmtp: false,
      seedPhraseSigner: undefined,
      otherSigner: signer,
    }));
  }, []);

  const generateWallet = useCallback(async () => {
    setLoading(true);
    const signer = new Wallet(utils.randomPrivateKey());
    const address = await signer.getAddress();
    setUser({
      address,
      isEphemeral: true,
      isOnXmtp: false,
      seedPhraseSigner: signer,
      otherSigner: undefined,
    });
  }, []);

  const insets = useSafeAreaInsets();

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
      const signer = thirdwebSigner || user.otherSigner;
      if (!signer || requestingSignatures.current) return;
      requestingSignatures.current = true;
      try {
        const newAddress = await signer.getAddress();
        if (getAccountsList().includes(newAddress)) {
          Alert.alert(
            "Already connected",
            "This account is already connected to Converse."
          );
          disconnect();
          return;
        }
        const isOnNetwork = await isOnXmtp(newAddress);
        setUser({
          address: newAddress,
          isEphemeral: false,
          isOnXmtp: isOnNetwork,
          seedPhraseSigner: undefined,
          otherSigner: user.otherSigner,
        });
        setLoading(false);
      } catch (e) {
        console.log(e);
      }
      requestingSignatures.current = false;
    };

    requestSignatures();
  }, [thirdwebSigner, user.otherSigner, disconnect]);

  const waitingForSecondSignatureRef = useRef(waitingForSecondSignature);
  useEffect(() => {
    waitingForSecondSignatureRef.current = waitingForSecondSignature;
  }, [waitingForSecondSignature]);

  const initXmtpClient = useCallback(async () => {
    const signer = user.seedPhraseSigner || thirdwebSigner || user.otherSigner;
    if (
      !signer ||
      (user.address && initiatingClientFor.current === user.address)
    ) {
      return;
    }
    initiatingClientFor.current = user.address;

    try {
      const keysBuffer = await getXmtpKeysFromSigner(
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
      );
      const base64Key = keysBuffer.toString("base64");
      await waitForLogoutTasksDone(500);
      await saveXmtpKey(user.address, base64Key);
      // Successfull login for user, let's setup
      // the storage !
      useAccountsStore.getState().setCurrentAccount(user.address, true);
      await initDb(user.address);

      if (user.isEphemeral) {
        getSettingsStore(user.address).getState().setEphemeralAccount(true);
      } else {
        getSettingsStore(user.address).getState().setEphemeralAccount(false);
      }
      useOnboardingStore.getState().setAddingNewAccount(false);
      // Now we can instantiate the XMTP Client
      getXmtpClient(user.address);
    } catch (e) {
      initiatingClientFor.current = undefined;
      setLoading(false);
      clickedSecondSignature.current = false;
      setWaitingForSecondSignature(false);
      console.error(e);
    }
  }, [thirdwebSigner, user]);

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
  } else if (connectionMethod === "seedPhrase" || user.seedPhraseSigner) {
    title = "Seed phrase";
    text =
      "Enter your wallet's seed phrase. It will be used to connect to the XMTP network and it will not be stored anywhere.";
    picto = "key.horizontal";
    primaryButtonText = "Connect";
    primaryButtonAction = () => {
      if (!seedPhrase || seedPhrase.trim().length === 0) return;
      loginWithSeedPhrase(seedPhrase.trim());
    };
  } else if (connectionMethod === "desktop") {
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
  } else if (connectionMethod === "phone") {
    title = "Connect by phone";
    picto = "phone.bubble.fill";
    text = <Text>Login with your phone!</Text>;
  }

  if (desktopConnectSessionId) {
    return <DesktopConnect />;
  }

  let onboardingContent: React.ReactNode;
  let onWalletSelector = false;

  const signer = thirdwebSigner || user.otherSigner;

  if (!signer && connectionMethod === "wallet" && !loading) {
    // Default screen
    onWalletSelector = true;
    onboardingContent = (
      <WalletSelector
        setConnectionMethod={setConnectionMethod}
        disconnect={disconnect}
        setLoading={setLoading}
        setSigner={setSigner}
      />
    );
  } else if (!signer && !loading && connectionMethod === "seedPhrase") {
    // Seed phrase login
    backButtonText = "Back to home screen";
    backButtonAction = () => {
      setConnectionMethod("wallet");
    };
    onboardingContent = (
      <SeedPhraseConnect
        seedPhrase={seedPhrase}
        setSeedPhrase={setSeedPhrase}
        generateWallet={generateWallet}
        keyboardVerticalOffset={keyboardVerticalOffset}
        setKeyboardVerticalOffset={setKeyboardVerticalOffset}
      />
    );
  } else if (!signer && !loading && connectionMethod === "desktop") {
    // Desktop login
    onboardingContent = (
      <>
        <Button
          title="Back to home screen"
          style={[styles.logout, { marginTop: "auto" }]}
          variant="text"
          textStyle={{ fontWeight: "600" }}
          onPress={() => {
            setConnectionMethod("wallet");
          }}
        />
      </>
    );
  } else if (!signer && !loading && connectionMethod === "phone") {
    // Phone login
    backButtonAction = () => {
      setConnectionMethod("wallet");
    };
    onboardingContent = <PrivyConnect />;
  } else if (signer && user.address) {
    // Logged, need to do signatures
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
    <>
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
      {addingNewAccount && onWalletSelector && (
        <Button
          title="Cancel"
          variant="text"
          style={[styles.cancelButton, { top: insets.top + 9 }]}
          onPress={() => setAddingNewAccount(false)}
        />
      )}
    </>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
    cancelButton: {
      position: "absolute",
      top: 0,
      left: Platform.OS === "android" ? 10 : 30,
    },
  });
};
