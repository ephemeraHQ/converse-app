import { translate } from "@i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { awaitableAlert } from "@utils/alert";
import { getDatabaseFilesForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { logoutAccount } from "@utils/logout";
import { sentryTrackMessage } from "@utils/sentry";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { reloadAppAsync } from "expo";
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
import ValueProps from "./ValueProps";
import {
  getAccountsList,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { isOnXmtp } from "../../utils/xmtpRN/client";
import {
  getInboxId,
  getXmtpBase64KeyFromSigner,
} from "../../utils/xmtpRN/signIn";

export default function ConnectViaWallet({
  connectWithBase64Key,
}: {
  connectWithBase64Key: (base64Key: string, onError: () => void) => void;
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

  const inXmtpClientCreationFlow = useRef(false);

  const disconnect = useCallback(
    async (resetLoading = true) => {
      if (inXmtpClientCreationFlow.current) {
        /*
        Pretty edge case where user has started the XMTP flow 
        i.e. user has done at least one signature but then decides
        to logout before going to the end of the flow. The XMTP SDK
        gets into a broken state
        */
        reloadAppAsync();
        return;
      }
      logger.debug("[Onboarding] Logging out");
      if (address) {
        logoutAccount(
          address,
          false,
          true,
          () => {},
          () => {}
        );
      }
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
      address,
    ]
  );

  const handlingThirdwebSigner = useRef("");

  useEffect(() => {
    (async () => {
      if (thirdwebSigner && !handlingThirdwebSigner.current) {
        try {
          const a = await thirdwebSigner.getAddress();
          handlingThirdwebSigner.current = a;
          if (getAccountsList().includes(a)) {
            Alert.alert(
              translate("connectViaWallet.alreadyConnected.title"),
              translate("connectViaWallet.alreadyConnected.message")
            );
            disconnect();
            // At least activate said wallet so user can logout again
            // but not be stuck
            useAccountsStore.getState().setCurrentAccount(a, false);
            return;
          }
          const isOnNetwork = await isOnXmtp(a);
          setOnXmtp(isOnNetwork);
          const inboxId = await getInboxId(a);
          const v3Dbs = await getDatabaseFilesForInboxId(inboxId);
          setAlreadyV3Db(
            v3Dbs.filter((n) => n.name.endsWith(".db3")).length > 0
          );
          setSigner(thirdwebSigner);
          setLoading(false);
          logger.debug(
            `[Onboarding] User connected wallet ${thirdwebWallet?.id} (${a}). ${
              isOnNetwork ? "Already" : "Not yet"
            } on XMTP. V3 database ${
              v3Dbs.length > 0 ? "already" : "not"
            } present`
          );
        } catch (e) {
          logger.error(e, { context: "Handling thirdweb signer" });
          handlingThirdwebSigner.current = "";
        }
      }
    })();
  }, [thirdwebSigner, setSigner, setLoading, disconnect, thirdwebWallet?.id]);

  const initiatingClientFor = useRef<string | undefined>(undefined);

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
              logger.debug("[Onboarding] Still not signer after 1.5 sec");
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
    logger.debug("[Onboarding] ConnectViaWallet initiXmtpClient");
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

    const signaturesAsked = {
      create: false,
      enable: false,
      authenticate: false,
    };

    try {
      logger.debug("[Onboarding] Connecting to XMTP using an external wallet");
      inXmtpClientCreationFlow.current = true;
      const base64Key = await getXmtpBase64KeyFromSigner(
        signer,
        async () => {
          await awaitableAlert(
            translate("current_installation_revoked"),
            translate("current_installation_revoked_description")
          );
          disconnect();
        },
        async () => {
          signaturesAsked.create = true;
          logger.debug("[Onboarding] Triggering create signature");
          // Before calling "create" signature
          setWaitingForNextSignature(true);
          clickedSignature.current = false;
        },
        async () => {
          signaturesAsked.enable = true;
          if (signaturesAsked.create) {
            logger.debug("[Onboarding] Create signature success!");
          }
          // Before calling "enable" signature
          if (waitingForNextSignatureRef.current) {
            setSignaturesDone((s) => s + 1);
            setLoading(false);
            logger.debug("Waiting until signature click for Enable");
            await waitForClickSignature();
            logger.debug("Click on Sign done for Enable");
          }
          logger.debug("[Onboarding] Triggering enable signature");
          if (onXmtp && !alreadyV3Db) {
            logger.debug(
              "Already on XMTP, but not db present, will need a new signature"
            );
            setWaitingForNextSignature(true);
          } else {
            logger.debug(
              "New to XMTP, or db already present, will not need a new signature"
            );
            setWaitingForNextSignature(false);
          }
        },
        async () => {
          if (signaturesAsked.enable) {
            logger.debug("[Onboarding] Enable signature success!");
          }
          if (waitingForNextSignatureRef.current) {
            setSignaturesDone((s) => s + 1);
            setLoading(false);
            logger.debug("Waiting until signature click for Authenticate");
            await waitForClickSignature();
            logger.debug("Click on Sign done for Authenticate");
            setWaitingForNextSignature(false);
          }
          logger.debug(
            "[Onboarding] Triggering authenticate to inbox signature"
          );
        }
      );
      inXmtpClientCreationFlow.current = false;
      if (!base64Key) return;
      logger.debug("[Onboarding] Got base64 key, now connecting");
      await connectWithBase64Key(base64Key, disconnect);
      logger.info("[Onboarding] Successfully logged in using a wallet");
      onboardingDone = true;
    } catch (e) {
      initiatingClientFor.current = undefined;
      setLoading(false);
      clickedSignature.current = false;
      setWaitingForNextSignature(false);
      logger.error(e);
    }
  }, [
    address,
    alreadyV3Db,
    connectWithBase64Key,
    disconnect,
    onXmtp,
    setLoading,
    signer,
    waitForClickSignature,
  ]);

  let title = translate("connectViaWallet.firstSignature.title");
  let subtitle = (
    <>
      <Text>{translate("connectViaWallet.firstSignature.explanation")}</Text>
    </>
  );
  let backButtonText = undefined as string | undefined;
  let backButtonAction = () => {};

  const primaryButtonAction = () => {
    if (waitingForNextSignature) {
      setLoading(true);
      clickedSignature.current = true;
    } else {
      logger.debug("[Onboarding] User clicked on initial sign button");
      setLoading(true);
      initXmtpClient();
    }
  };

  if (address) {
    backButtonText = translate("connectViaWallet.cancel");
    backButtonAction = disconnect;
  } else {
    backButtonText = translate("connectViaWallet.backButton");
    backButtonAction = () => {
      setConnectionMethod(undefined);
    };
  }

  if (signer && address) {
    if (onXmtp) {
      if (!alreadyV3Db) {
        title = `${translate("connectViaWallet.sign")} (${
          signaturesDone + 1
        }/2)`;
      }
      subtitle = (
        <>
          <Text>
            {translate("connectViaWallet.secondSignature.explanation")}
          </Text>
        </>
      );
    } else if (
      (waitingForNextSignature && !loading) ||
      clickedSignature.current
    ) {
      title = translate("connectViaWallet.secondSignature.title");
      subtitle = (
        <Text>{translate("connectViaWallet.secondSignature.explanation")}</Text>
      );
    } else {
      title = translate("connectViaWallet.firstSignature.title");
      subtitle = (
        <>
          <Text>
            {translate("connectViaWallet.firstSignature.explanation")}
          </Text>
        </>
      );
    }
  }

  const showValuePropsAndTerms =
    !(waitingForNextSignature && !loading) || clickedSignature.current;

  return (
    <OnboardingComponent
      picto="tray"
      title={title}
      subtitle={subtitle}
      primaryButtonAction={primaryButtonAction}
      primaryButtonText={translate("connectViaWallet.sign")}
      backButtonText={backButtonText}
      backButtonAction={backButtonAction}
      showTerms={showValuePropsAndTerms}
    >
      {showValuePropsAndTerms && (
        <>
          <ValueProps />
        </>
      )}
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
