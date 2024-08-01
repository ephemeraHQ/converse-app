import AsyncStorage from "@react-native-async-storage/async-storage";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { getDatabaseFilesForInboxId } from "@utils/fileSystem";
import { strings } from "@utils/i18n/strings";
import {
  sentryAddBreadcrumb,
  sentryTrackError,
  sentryTrackMessage,
} from "@utils/sentry";
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
import {
  getInboxId,
  getXmtpBase64KeyFromSigner,
} from "../../utils/xmtpRN/signIn";

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
    resetOnboarding,
  } = useOnboardingStore(
    useSelect([
      "setConnectionMethod",
      "signer",
      "setSigner",
      "loading",
      "setLoading",
      "address",
      "resetOnboarding",
    ])
  );
  const [onXmtp, setOnXmtp] = useState(false);
  const [alreadyV3Db, setAlreadyV3Db] = useState(false);
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

  const clickedSignature = useRef(false);

  const [waitingForNextSignature, setWaitingForNextSignature] = useState(false);
  const waitingForNextSignatureRef = useRef(waitingForNextSignature);
  useEffect(() => {
    waitingForNextSignatureRef.current = waitingForNextSignature;
  }, [waitingForNextSignature]);

  const disconnect = useCallback(
    async (resetLoading = true) => {
      setWaitingForNextSignature(false);
      clickedSignature.current = false;
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
      setWaitingForNextSignature,
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
        setOnXmtp(isOnNetwork);
        const inboxId = await getInboxId(a);
        const v3Dbs = await getDatabaseFilesForInboxId(inboxId);
        setAlreadyV3Db(v3Dbs.length > 0);
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

  const waitForClickSignature = useCallback(async () => {
    while (!clickedSignature.current) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }, []);

  const [signaturesDone, setSignaturesDone] = useState(0);

  const initXmtpClient = useCallback(async () => {
    console.log("in initixmtpclient");
    if (!signer || !address || initiatingClientFor.current === address) {
      return;
    }
    initiatingClientFor.current = address;
    let onboardingDone = false;
    setTimeout(() => {
      if (onboardingDone === false) {
        sentryTrackMessage("Onboarding took more than 30 seconds");
      }
    }, 30000);

    try {
      sentryAddBreadcrumb("Onboarding using a wallet");
      const base64Key = await getXmtpBase64KeyFromSigner(
        signer,
        async () => {
          sentryAddBreadcrumb("Asking for create signature");
          // Before calling "create" signature
          setWaitingForNextSignature(true);
          clickedSignature.current = false;
        },
        async () => {
          sentryAddBreadcrumb("Asking for enable signature");
          // Before calling "enable" signature
          if (waitingForNextSignatureRef.current) {
            setSignaturesDone((s) => s + 1);
            setLoading(false);
            sentryAddBreadcrumb("Waiting until signature click for Enable");
            await waitForClickSignature();
            sentryAddBreadcrumb("Click on Sign done for Enable");
          }
          if (onXmtp && !alreadyV3Db) {
            sentryAddBreadcrumb(
              "Already on XMTP, but not db present, will need a new signature"
            );
            setWaitingForNextSignature(true);
          } else {
            sentryAddBreadcrumb(
              "New to XMTP, or db already present, will not need a new signature"
            );
            setWaitingForNextSignature(false);
          }
        },
        async () => {
          sentryAddBreadcrumb("Asking for auth to inbox signature");
          if (waitingForNextSignatureRef.current) {
            setSignaturesDone((s) => s + 1);
            setLoading(false);
            sentryAddBreadcrumb(
              "Waiting until signature click for Authenticate"
            );
            await waitForClickSignature();
            sentryAddBreadcrumb("Click on Sign done for Authenticate");
            setWaitingForNextSignature(false);
          }
        }
      );
      sentryAddBreadcrumb("Got base64 key, now connecting");
      await connectWithBase64Key(base64Key);
      sentryTrackMessage("Successfully logged in using a wallet");
      onboardingDone = true;
    } catch (e) {
      initiatingClientFor.current = undefined;
      setLoading(false);
      clickedSignature.current = false;
      setWaitingForNextSignature(false);
      console.error(e);
      sentryTrackError(e);
    }
  }, [
    address,
    alreadyV3Db,
    connectWithBase64Key,
    onXmtp,
    setLoading,
    signer,
    waitForClickSignature,
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
    if (waitingForNextSignature) {
      setLoading(true);
      clickedSignature.current = true;
    } else {
      setLoading(true);
      initXmtpClient();
    }
  };

  if (address) {
    backButtonText = `Log out from ${shortAddress(address)}`;
    backButtonAction = disconnect;
  }

  if (signer && address) {
    if (onXmtp) {
      if (!alreadyV3Db) {
        title = `${strings.sign} (${signaturesDone + 1}/2)`;
      }
      subtitle = (
        <>
          <Text>
            Please sign with your wallet so that we make sure you own it.
            {"\n\n"}
          </Text>
          {termsAndConditions}
        </>
      );
    } else if (
      (waitingForNextSignature && !loading) ||
      clickedSignature.current
    ) {
      title = `${strings.sign} (2/2)`;
      subtitle = <Text>{strings.sign_access}</Text>;
    } else {
      title = `${strings.sign} (1/2)`;
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
