import { translate } from "@i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { awaitableAlert } from "@utils/alert";
import { getDatabaseFilesForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { logoutAccount } from "@utils/logout";
import { sentryTrackMessage } from "@utils/sentry";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Text } from "react-native";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect as useThirdwebDisconnect,
} from "thirdweb/react";

import {
  ConnectViaWalletStoreProvider,
  useConnectViaWalletStoreContext,
} from "./connectViaWalletStore";
import {
  getAccountsList,
  useAccountsStore,
} from "../../../data/store/accountsStore";
import { useAppStateHandlers } from "../../../hooks/useAppStateHandlers";
import { isOnXmtp } from "../../../utils/xmtpRN/client";
import {
  getInboxId,
  getXmtpBase64KeyFromSigner,
} from "../../../utils/xmtpRN/signIn";
import DeprecatedOnboardingComponent from "../DeprecatedOnboardingComponent";
import ValueProps from "../ValueProps";
import { connectWithBase64Key } from "../init-xmtp-client";

function useThirdwebSigner() {
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

  return { thirdwebSigner };
}

function useXmtpConnection() {
  const {
    signer,
    address,
    onXmtp,
    alreadyV3Db,
    setLoading,
    setWaitingForNextSignature,
    setSignaturesDone,
  } = useConnectViaWalletStoreContext((state) => ({
    signer: state.signer,
    address: state.address,
    onXmtp: state.onXmtp,
    alreadyV3Db: state.alreadyV3Db,
    setLoading: state.setLoading,
    setWaitingForNextSignature: state.setWaitingForNextSignature,
    setSignaturesDone: state.setSignaturesDone,
  }));

  const inXmtpClientCreationFlow = useRef(false);
  const initiatingClientFor = useRef<string | undefined>(undefined);
  const clickedSignature = useRef(false);

  const waitForClickSignature = useCallback(async () => {
    while (!clickedSignature.current) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }, []);

  const initXmtpClient = useCallback(async () => {
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
          logger.debug("[Onboarding] Triggering create signature");
          setWaitingForNextSignature(true);
          clickedSignature.current = false;
        },
        async () => {
          setSignaturesDone((s) => s + 1);
          setLoading(false);
          logger.debug("Waiting until signature click for Enable");
          await waitForClickSignature();
          logger.debug("Click on Sign done for Enable");
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
          setSignaturesDone((s) => s + 1);
          setLoading(false);
          logger.debug("Waiting until signature click for Authenticate");
          await waitForClickSignature();
          logger.debug("Click on Sign done for Authenticate");
          setWaitingForNextSignature(false);
          logger.debug(
            "[Onboarding] Triggering authenticate to inbox signature"
          );
        }
      );

      inXmtpClientCreationFlow.current = false;

      if (!base64Key) return;

      logger.debug("[Onboarding] Got base64 key, now connecting");

      await connectWithBase64Key({
        address,
        base64Key,
      });

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
    onXmtp,
    setLoading,
    signer,
    waitForClickSignature,
    setWaitingForNextSignature,
    setSignaturesDone,
  ]);

  return { initXmtpClient };
}

export function ConnectViaWallet() {
  return (
    <ConnectViaWalletStoreProvider>
      <Content />
    </ConnectViaWalletStoreProvider>
  );
}

const Content = memo(function Content() {
  const {
    address,
    loading,
    waitingForNextSignature,
    setSigner,
    setLoading,
    setOnXmtp,
    setAlreadyV3Db,
    resetOnboarding,
    signer,
    onXmtp,
    alreadyV3Db,
    signaturesDone,
  } = useConnectViaWalletStoreContext((state) => ({
    address: state.address,
    loading: state.loading,
    waitingForNextSignature: state.waitingForNextSignature,
    setSigner: state.setSigner,
    setLoading: state.setLoading,
    setOnXmtp: state.setOnXmtp,
    setAlreadyV3Db: state.setAlreadyV3Db,
    resetOnboarding: state.resetOnboarding,
    signer: state.signer,
    onXmtp: state.onXmtp,
    alreadyV3Db: state.alreadyV3Db,
    signaturesDone: state.signaturesDone,
  }));

  const { thirdwebSigner } = useThirdwebSigner();
  const { disconnect: disconnectWallet } = useThirdwebDisconnect();
  const thirdwebWallet = useActiveWallet();

  const disconnect = useCallback(
    async (resetLoading = true) => {
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
    },
    [address, resetOnboarding, setLoading, disconnectWallet, thirdwebWallet]
  );

  const { initXmtpClient } = useXmtpConnection();

  const signerRef = useRef<Signer | undefined>();

  useAppStateHandlers({
    onForeground: () => {
      setTimeout(() => {
        if (!signerRef.current) {
          logger.debug("[Onboarding] Still not signer after 1.5 sec");
          disconnect();
        }
      }, 1500);
    },
  });

  useEffect(() => {
    signerRef.current = thirdwebSigner;
  }, [thirdwebSigner]);

  useEffect(() => {
    (async () => {
      if (thirdwebSigner) {
        try {
          const a = await thirdwebSigner.getAddress();
          if (getAccountsList().includes(a)) {
            Alert.alert(
              translate("connectViaWallet.alreadyConnected.title"),
              translate("connectViaWallet.alreadyConnected.message")
            );
            disconnect();
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
            `[Onboarding] User connected wallet (${a}). ${
              isOnNetwork ? "Already" : "Not yet"
            } on XMTP. V3 database ${
              v3Dbs.length > 0 ? "already" : "not"
            } present`
          );
        } catch (e) {
          logger.error(e, { context: "Handling thirdweb signer" });
        }
      }
    })();
  }, [
    thirdwebSigner,
    setSigner,
    setLoading,
    disconnect,
    setOnXmtp,
    setAlreadyV3Db,
  ]);

  const primaryButtonAction = useCallback(() => {
    if (waitingForNextSignature) {
      setLoading(true);
    } else {
      setLoading(true);
      initXmtpClient();
    }
  }, [waitingForNextSignature, setLoading, initXmtpClient]);

  const backButtonAction = address ? disconnect : () => {};
  const backButtonText = address
    ? translate("connectViaWallet.cancel")
    : translate("connectViaWallet.backButton");

  if (!signer || !address) {
    return (
      <DeprecatedOnboardingComponent
        picto="tray"
        title={translate("connectViaWallet.firstSignature.title")}
        subtitle={
          <Text>
            {translate("connectViaWallet.firstSignature.explanation")}
          </Text>
        }
        primaryButtonAction={primaryButtonAction}
        primaryButtonText={translate("connectViaWallet.sign")}
        backButtonText={backButtonText}
        backButtonAction={backButtonAction}
        showTerms
      >
        <ValueProps />
      </DeprecatedOnboardingComponent>
    );
  }

  if (onXmtp && !alreadyV3Db) {
    return (
      <DeprecatedOnboardingComponent
        picto="tray"
        title={`${translate("connectViaWallet.sign")} (${
          signaturesDone + 1
        }/2)`}
        subtitle={
          <Text>
            {translate("connectViaWallet.secondSignature.explanation")}
          </Text>
        }
        primaryButtonAction={primaryButtonAction}
        primaryButtonText={translate("connectViaWallet.sign")}
        backButtonText={backButtonText}
        backButtonAction={backButtonAction}
        showTerms
      >
        <ValueProps />
      </DeprecatedOnboardingComponent>
    );
  }

  if (onXmtp && alreadyV3Db) {
    return (
      <DeprecatedOnboardingComponent
        picto="tray"
        title={translate("connectViaWallet.firstSignature.title")}
        subtitle={
          <Text>
            {translate("connectViaWallet.secondSignature.explanation")}
          </Text>
        }
        primaryButtonAction={primaryButtonAction}
        primaryButtonText={translate("connectViaWallet.sign")}
        backButtonText={backButtonText}
        backButtonAction={backButtonAction}
        showTerms
      >
        <ValueProps />
      </DeprecatedOnboardingComponent>
    );
  }

  if (waitingForNextSignature && !loading) {
    return (
      <DeprecatedOnboardingComponent
        picto="tray"
        title={translate("connectViaWallet.secondSignature.title")}
        subtitle={
          <Text>
            {translate("connectViaWallet.secondSignature.explanation")}
          </Text>
        }
        primaryButtonAction={primaryButtonAction}
        primaryButtonText={translate("connectViaWallet.sign")}
        backButtonText={backButtonText}
        backButtonAction={backButtonAction}
        showTerms={false}
      >
        <></>
      </DeprecatedOnboardingComponent>
    );
  }

  return (
    <DeprecatedOnboardingComponent
      picto="tray"
      title={translate("connectViaWallet.firstSignature.title")}
      subtitle={
        <Text>{translate("connectViaWallet.firstSignature.explanation")}</Text>
      }
      primaryButtonAction={primaryButtonAction}
      primaryButtonText={translate("connectViaWallet.sign")}
      backButtonText={backButtonText}
      backButtonAction={backButtonAction}
      showTerms
    >
      <ValueProps />
    </DeprecatedOnboardingComponent>
  );
});
