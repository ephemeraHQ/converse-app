import AsyncStorage from "@react-native-async-storage/async-storage";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { strings } from "@utils/i18n/strings";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
} from "thirdweb/react";

import OnboardingComponent from "./OnboardingComponent";
import { getAccountsList } from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { shortAddress } from "../../utils/str";
import { isOnXmtp } from "../../utils/xmtpRN/client";
import { getXmtpBase64KeyFromSigner } from "../../utils/xmtpRN/signIn";

export default function ConnectViaWallet({
  connectWithBase64Key,
}: {
  connectWithBase64Key: (base64Key: string) => void;
}) {
  const {
    setConnectionMethod,
    signer,
    setSigner,
    address,
    loading,
    setLoading,
    waitingForSecondSignature,
    setWaitingForSecondSignature,
    resetOnboarding,
  } = useOnboardingStore(
    useSelect([
      "setConnectionMethod",
      "signer",
      "setSigner",
      "loading",
      "setLoading",
      "waitingForSecondSignature",
      "setWaitingForSecondSignature",
      "address",
      "resetOnboarding",
    ])
  );
  const [onXmtp, setOnXmtp] = useState(false);
  const styles = useStyles();
  const thirdwebWallet = useActiveWallet();
  const thirdwebAccount = useActiveAccount();
  const [thirdwebSigner, setThirdwebSigner] = useState<Signer | undefined>();
  useEffect(() => {
    if (thirdwebAccount) {
      ethers5Adapter.signer
        .toEthers({
          client: thirdwebClient,
          chain: ethereum,
          account: thirdwebAccount,
        })
        .then(setThirdwebSigner);
    } else {
      setThirdwebSigner(undefined);
    }
  }, [thirdwebAccount]);

  const { disconnect: disconnectWallet } = useDisconnect();

  const clickedSecondSignature = useRef(false);

  const waitingForSecondSignatureRef = useRef(waitingForSecondSignature);
  useEffect(() => {
    waitingForSecondSignatureRef.current = waitingForSecondSignature;
  }, [waitingForSecondSignature]);

  const disconnect = useCallback(
    async (resetLoading = true) => {
      setWaitingForSecondSignature(false);
      clickedSecondSignature.current = false;
      initiatingClientFor.current = undefined;
      resetOnboarding();
      if (resetLoading) {
        setLoading(false);
      }
      if (thirdwebWallet) {
        await disconnectWallet(thirdwebWallet);
      }
      const storageKeys = await AsyncStorage.getAllKeys();
      const wcKeys = storageKeys.filter((k) => k.startsWith("wc@2:"));
      await AsyncStorage.multiRemove(wcKeys);
      setConnectionMethod(undefined);
    },
    [
      disconnectWallet,
      resetOnboarding,
      setConnectionMethod,
      setLoading,
      setWaitingForSecondSignature,
      thirdwebWallet,
    ]
  );

  useEffect(() => {
    (async () => {
      if (thirdwebSigner) {
        const a = await thirdwebSigner.getAddress();
        if (getAccountsList().includes(a)) {
          Alert.alert(
            "Already connected",
            "This account is already connected to Converse."
          );
          disconnect();
          return;
        }
        const isOnNetwork = await isOnXmtp(a);
        console.log("in here yo");
        setOnXmtp(isOnNetwork);
        setSigner(thirdwebSigner);
        setLoading(false);
      }
    })();
  }, [thirdwebSigner, setSigner, setLoading, disconnect]);

  const initiatingClientFor = useRef<string | undefined>(undefined);
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

  const appState = useRef(AppState.currentState);
  const signerRef = useRef(thirdwebSigner);
  useEffect(() => {
    signerRef.current = thirdwebSigner;
  }, [thirdwebSigner]);
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

  const initXmtpClient = useCallback(async () => {
    if (!signer || !address || initiatingClientFor.current === address) {
      return;
    }
    initiatingClientFor.current = address;

    try {
      const base64Key = await getXmtpBase64KeyFromSigner(
        signer,
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
      );
      await connectWithBase64Key(base64Key);
    } catch (e) {
      initiatingClientFor.current = undefined;
      setLoading(false);
      clickedSecondSignature.current = false;
      setWaitingForSecondSignature(false);
      console.error(e);
    }
  }, [
    address,
    connectWithBase64Key,
    setLoading,
    setWaitingForSecondSignature,
    signer,
  ]);

  let subtitle = (
    <>
      <Text>
        This first signature will enable your wallet to send and receive
        messages.{"\n\n"}
      </Text>
      {termsAndConditions}
    </>
  );
  let title = "Sign";
  let backButtonText = undefined as string | undefined;
  let backButtonAction = () => {};

  const primaryButtonAction = () => {
    if (waitingForSecondSignature) {
      setLoading(true);
      clickedSecondSignature.current = true;
    } else {
      setLoading(true);
      initXmtpClient();
    }
  };

  if (!loading && address) {
    backButtonText = `Log out from ${shortAddress(address)}`;
    backButtonAction = disconnect;
  }

  if (signer && address) {
    if (onXmtp) {
      subtitle = (
        <>
          <Text>
            Second and last step: please sign with your wallet so that we make
            sure you own it.{"\n\n"}
          </Text>
          {termsAndConditions}
        </>
      );
    } else if (
      (waitingForSecondSignature && !loading) ||
      clickedSecondSignature.current
    ) {
      title = strings.sign_2_of_2;
      subtitle = <Text>{strings.sign_access}</Text>;
    } else {
      title = strings.sign_1_of_2;
      subtitle = (
        <>
          <Text>{strings.first_signature_explanation}</Text>
          {termsAndConditions}
        </>
      );
    }
  }

  return (
    <OnboardingComponent
      picto="signature"
      title={title}
      subtitle={subtitle}
      primaryButtonAction={primaryButtonAction}
      primaryButtonText={title}
      backButtonText={backButtonText}
      backButtonAction={backButtonAction}
    >
      <></>
    </OnboardingComponent>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    link: {
      textDecorationLine: "underline",
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
  });
};
