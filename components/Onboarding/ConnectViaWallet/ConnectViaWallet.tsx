import { translate } from "@i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { awaitableAlert } from "@utils/alert";
import { getDatabaseFilesForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { logoutAccount } from "@utils/logout";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect as useThirdwebDisconnect,
} from "thirdweb/react";

import {
  getAccountsList,
  useAccountsStore,
} from "../../../data/store/accountsStore";
import { VStack } from "../../../design-system/VStack";
import { useAppStateHandlers } from "../../../hooks/useAppStateHandlers";
import { useRouter } from "../../../navigation/useNavigation";
import { spacing } from "../../../theme";
import { wait } from "../../../utils/general";
import { isOnXmtp } from "../../../utils/xmtpRN/client";
import {
  getInboxId,
  getXmtpBase64KeyFromSigner,
} from "../../../utils/xmtpRN/signIn";
import { OnboardingPictoTitleSubtitle } from "../OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../OnboardingPrimaryCtaButton";
import { Terms } from "../Terms";
import ValueProps from "../ValueProps";
import { connectWithBase64Key } from "../init-xmtp-client";
import {
  useConnectViaWalletStore,
  useConnectViaWalletStoreContext,
} from "./connectViaWalletStore";

export const ConnectViaWallet = memo(function ConnectViaWallet() {
  const {
    address,
    loading,
    waitingForNextSignature,
    signer,
    onXmtp,
    alreadyV3Db,
    signaturesDone,
  } = useConnectViaWalletStoreContext((state) => ({
    address: state.address,
    loading: state.loading,
    waitingForNextSignature: state.waitingForNextSignature,
    signer: state.signer,
    onXmtp: state.onXmtp,
    alreadyV3Db: state.alreadyV3Db,
    signaturesDone: state.signaturesDone,
  }));

  const connectViewWalletStore = useConnectViaWalletStore();
  const disconnect = useDisconnect();
  const { initXmtpClient } = useXmtpConnection();
  const { thirdwebSigner } = useThirdwebSigner();
  const router = useRouter();

  useAppStateHandlers({
    deps: [thirdwebSigner],
    onForeground: () => {
      setTimeout(() => {
        if (!thirdwebSigner) {
          logger.debug("[Connect Wallet] Still no signer after 1.5 sec");
          disconnect().catch(sentryTrackError);
          router.goBack();
        }
      }, 1500);
    },
  });

  const primaryButtonAction = useCallback(() => {
    if (waitingForNextSignature) {
      logger.debug("[Connect Wallet] User clicked on second sign button");
      connectViewWalletStore.getState().setLoading(true);
      connectViewWalletStore.getState().setClickedSignature(true);
    } else {
      logger.debug("[Connect Wallet] User clicked on initial sign button");
      connectViewWalletStore.getState().setLoading(true);
      initXmtpClient();
    }
  }, [waitingForNextSignature, connectViewWalletStore, initXmtpClient]);

  if (!signer || !address) {
    return null;
  }

  if (onXmtp && !alreadyV3Db) {
    return (
      <>
        <OnboardingPictoTitleSubtitle.Container>
          <OnboardingPictoTitleSubtitle.Picto picto="tray" />
          <OnboardingPictoTitleSubtitle.Title>
            {`${translate("connectViaWallet.sign")} (${signaturesDone + 1}/2)`}
          </OnboardingPictoTitleSubtitle.Title>
          <OnboardingPictoTitleSubtitle.Subtitle>
            {translate("connectViaWallet.firstSignature.explanation")}
          </OnboardingPictoTitleSubtitle.Subtitle>
        </OnboardingPictoTitleSubtitle.Container>
        <ValueProps />
        <VStack
          style={{
            rowGap: spacing.sm,
            marginTop: spacing.lg,
          }}
        >
          <OnboardingPrimaryCtaButton
            onPress={primaryButtonAction}
            title={translate("connectViaWallet.sign")}
          />
          <Terms />
        </VStack>
      </>
    );
  }

  if (onXmtp && alreadyV3Db) {
    return (
      <>
        <OnboardingPictoTitleSubtitle.Container>
          <OnboardingPictoTitleSubtitle.Picto picto="tray" />
          <OnboardingPictoTitleSubtitle.Title>
            {translate("connectViaWallet.firstSignature.title")}
          </OnboardingPictoTitleSubtitle.Title>
          <OnboardingPictoTitleSubtitle.Subtitle>
            {translate("connectViaWallet.secondSignature.explanation")}
          </OnboardingPictoTitleSubtitle.Subtitle>
        </OnboardingPictoTitleSubtitle.Container>
        <ValueProps />
        <VStack
          style={{
            rowGap: spacing.sm,
            marginTop: spacing.lg,
          }}
        >
          <OnboardingPrimaryCtaButton
            onPress={primaryButtonAction}
            title={translate("connectViaWallet.sign")}
          />
          <Terms />
        </VStack>
      </>
    );
  }

  if (waitingForNextSignature && !loading) {
    return (
      <>
        <OnboardingPictoTitleSubtitle.Container>
          <OnboardingPictoTitleSubtitle.Picto picto="tray" />
          <OnboardingPictoTitleSubtitle.Title>
            {translate("connectViaWallet.secondSignature.title")}
          </OnboardingPictoTitleSubtitle.Title>
          <OnboardingPictoTitleSubtitle.Subtitle>
            {translate("connectViaWallet.secondSignature.explanation")}
          </OnboardingPictoTitleSubtitle.Subtitle>
        </OnboardingPictoTitleSubtitle.Container>
        <VStack
          style={{
            rowGap: spacing.sm,
            marginTop: spacing.lg,
          }}
        >
          <OnboardingPrimaryCtaButton
            onPress={primaryButtonAction}
            title={translate("connectViaWallet.sign")}
          />
          <Terms />
        </VStack>
      </>
    );
  }

  return (
    <>
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto picto="tray" />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("connectViaWallet.firstSignature.title")}
        </OnboardingPictoTitleSubtitle.Title>
        <OnboardingPictoTitleSubtitle.Subtitle>
          {translate("connectViaWallet.firstSignature.explanation")}
        </OnboardingPictoTitleSubtitle.Subtitle>
      </OnboardingPictoTitleSubtitle.Container>
      <ValueProps />
      <VStack
        style={{
          rowGap: spacing.sm,
          marginTop: spacing.lg,
        }}
      >
        <OnboardingPrimaryCtaButton
          onPress={primaryButtonAction}
          title={translate("connectViaWallet.sign")}
        />
        <Terms />
      </VStack>
    </>
  );
});

function useDisconnect() {
  const { disconnect: disconnectWallet } = useThirdwebDisconnect();
  const thirdwebWallet = useActiveWallet();
  const connectViewWalletStore = useConnectViaWalletStore();

  return useCallback(
    async () => {
      logger.debug("[Connect Wallet] Logging out");

      const address = connectViewWalletStore.getState().address;

      if (address) {
        logoutAccount(address, false, true, () => {});
      }

      if (thirdwebWallet) {
        disconnectWallet(thirdwebWallet);
      }

      const storageKeys = await AsyncStorage.getAllKeys();
      const wcKeys = storageKeys.filter((k) => k.startsWith("wc@2:"));
      await AsyncStorage.multiRemove(wcKeys);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thirdwebWallet]
  );
}

function useThirdwebSigner() {
  const thirdwebWallet = useActiveWallet();
  const thirdwebAccount = useActiveAccount();

  const [thirdwebSigner, setThirdwebSigner] = useState<Signer | undefined>();

  const disconnect = useDisconnect();

  const connectViewWalletStore = useConnectViaWalletStore();

  const handlingThirdwebSigner = useRef<string | undefined>(undefined);

  const router = useRouter();

  // Since we now keep a link to the connected wallet for
  // key revocation and transactional frames, in onboarding we
  // make sure that we disconnect the thirdweb signer before
  // instantiating a new one
  const readyToHandleThirdwebSigner = useRef(false);
  useEffect(() => {
    if (!readyToHandleThirdwebSigner.current) {
      disconnect()
        .then(() => {
          readyToHandleThirdwebSigner.current = true;
        })
        .catch(sentryTrackError);
    }
  }, [disconnect]);

  useEffect(() => {
    if (readyToHandleThirdwebSigner.current && thirdwebAccount) {
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

  useEffect(() => {
    (async () => {
      if (
        thirdwebSigner &&
        readyToHandleThirdwebSigner.current &&
        !handlingThirdwebSigner.current
      ) {
        try {
          const address = await thirdwebSigner.getAddress();
          handlingThirdwebSigner.current = address;

          if (getAccountsList().includes(address)) {
            Alert.alert(
              translate("connectViaWallet.alreadyConnected.title"),
              translate("connectViaWallet.alreadyConnected.message")
            );
            try {
              await disconnect();
            } catch (error) {
              // Handle the error appropriately, maybe show an alert to the user
              logger.error(
                "Error during disconnect and account activation:",
                error
              );
            } finally {
              // At least activate said wallet so user can logout again but not be stuck
              useAccountsStore.getState().setCurrentAccount(address, false);
              router.goBack();
            }
            return;
          }
          const isOnNetwork = await isOnXmtp(address);
          connectViewWalletStore.getState().setOnXmtp(isOnNetwork);
          const inboxId = await getInboxId(address);
          const v3Dbs = await getDatabaseFilesForInboxId(inboxId);
          connectViewWalletStore
            .getState()
            .setAlreadyV3Db(
              v3Dbs.filter((n) => n.name.endsWith(".db3")).length > 0
            );
          connectViewWalletStore.getState().setSigner(thirdwebSigner);
          connectViewWalletStore.getState().setAddress(address);
          connectViewWalletStore.getState().setLoading(false);
          logger.debug(
            `[Connect Wallet] User connected wallet ${thirdwebWallet?.id} (${address}). ${
              isOnNetwork ? "Already" : "Not yet"
            } on XMTP. V3 database ${
              v3Dbs.length > 0 ? "already" : "not"
            } present`
          );
        } catch (e) {
          logger.error(e, { context: "Handling thirdweb signer" });
          handlingThirdwebSigner.current = undefined;
        }
      }
    })();
  }, [
    disconnect,
    thirdwebSigner,
    connectViewWalletStore,
    thirdwebWallet,
    router,
  ]);

  return { thirdwebSigner };
}

function useXmtpConnection() {
  const { signer, address, onXmtp, alreadyV3Db } =
    useConnectViaWalletStoreContext((state) => ({
      signer: state.signer,
      address: state.address,
      onXmtp: state.onXmtp,
      alreadyV3Db: state.alreadyV3Db,
    }));

  const connectViewWalletStore = useConnectViaWalletStore();

  const inXmtpClientCreationFlow = useRef(false);

  const disconnect = useDisconnect();

  const router = useRouter();

  const waitForClickSignature = useCallback(async () => {
    while (!connectViewWalletStore.getState().clickedSignature) {
      const clickedSignature =
        connectViewWalletStore.getState().clickedSignature;
      logger.debug(
        `[Connect Wallet] Waiting for signature. Current clickedSignature value: ${clickedSignature}`
      );
      await wait(1000);
    }
  }, [connectViewWalletStore]);

  const initXmtpClient = useCallback(async () => {
    logger.debug("[Connect Wallet] starting initXmtpClient");

    if (!signer) {
      logger.debug(
        "[Connect Wallet] ConnectViaWallet initXmtpClient: No signer available"
      );
      return;
    }
    if (!address) {
      logger.debug(
        "[Connect Wallet] ConnectViaWallet initXmtpClient: No address available"
      );
      return;
    }
    if (
      connectViewWalletStore.getState().initiatingClientForAddress === address
    ) {
      logger.debug(
        "[Connect Wallet] ConnectViaWallet initXmtpClient: Already initiating client for this address"
      );
      return;
    }

    logger.debug(
      "[Connect Wallet] ConnectViaWallet initXmtpClient: Starting initiation process"
    );

    connectViewWalletStore.getState().setInitiatingClientForAddress(address);

    connectViewWalletStore.getState().setOnboardingDone(false);

    setTimeout(() => {
      const onboardingDone = connectViewWalletStore.getState().onboardingDone;
      if (!onboardingDone) {
        sentryTrackMessage("Onboarding took more than 30 seconds");
      }
    }, 30000);

    const signaturesAsked = {
      create: false,
      enable: false,
      authenticate: false,
    };

    try {
      logger.debug(
        "[Connect Wallet] Connecting to XMTP using an external wallet"
      );
      inXmtpClientCreationFlow.current = true;

      const base64Key = await getXmtpBase64KeyFromSigner(
        signer,
        async () => {
          logger.debug("[Connect Wallet] Installation revoked, disconnecting");
          try {
            await awaitableAlert(
              translate("current_installation_revoked"),
              translate("current_installation_revoked_description")
            );
            await disconnect();
          } catch (error) {
            sentryTrackError(error);
          } finally {
            router.goBack();
          }
        },
        async () => {
          signaturesAsked.create = true;
          logger.debug("[Connect Wallet] Triggering create signature");
          // Before calling "create" signature
          connectViewWalletStore.getState().setWaitingForNextSignature(true);
          connectViewWalletStore.getState().setClickedSignature(false);
        },
        async () => {
          signaturesAsked.enable = true;
          if (signaturesAsked.create) {
            logger.debug("[Connect Wallet] Create signature success!");
          }
          // Before calling "enable" signature
          const waitingForNextSignature =
            connectViewWalletStore.getState().waitingForNextSignature;

          if (waitingForNextSignature) {
            logger.debug("[Connect Wallet] waiting for next signature");
          } else {
            logger.debug("[Connect Wallet] not waiting for next signature");
          }

          if (waitingForNextSignature) {
            const currentSignaturesDone =
              connectViewWalletStore.getState().signaturesDone;
            connectViewWalletStore
              .getState()
              .setSignaturesDone(currentSignaturesDone + 1);
            connectViewWalletStore.getState().setLoading(false);
            logger.debug(
              "[Connect Wallet] Waiting until signature click for Enable"
            );
            await waitForClickSignature();
            logger.debug("[Connect Wallet] Click on Sign done for Enable");
          }

          logger.debug("[Connect Wallet] Triggering enable signature");
          if (onXmtp && !alreadyV3Db) {
            logger.debug(
              "[Connect Wallet] Already on XMTP, but no db present, will need a new signature"
            );
            connectViewWalletStore.getState().setWaitingForNextSignature(true);
          } else {
            logger.debug(
              "[Connect Wallet] New to XMTP, or db already present, will not need a new signature"
            );
            connectViewWalletStore.getState().setWaitingForNextSignature(false);
          }
        },
        async () => {
          if (signaturesAsked.enable) {
            logger.debug("[Connect Wallet] Enable signature success!");
          }
          if (connectViewWalletStore.getState().waitingForNextSignature) {
            const currentSignaturesDone =
              connectViewWalletStore.getState().signaturesDone;
            connectViewWalletStore
              .getState()
              .setSignaturesDone(currentSignaturesDone + 1);
            connectViewWalletStore.getState().setLoading(false);
            logger.debug(
              "[Connect Wallet] Waiting until signature click for Authenticate"
            );
            await waitForClickSignature();
            logger.debug(
              "[Connect Wallet] Click on Sign done for Authenticate"
            );
            connectViewWalletStore.getState().setWaitingForNextSignature(false);
          }
          logger.debug(
            "[Connect Wallet] Triggering authenticate to inbox signature"
          );
        }
      );

      inXmtpClientCreationFlow.current = false;

      if (!base64Key) {
        logger.debug("[Connect Wallet] No base64Key received, aborting");
        return;
      }

      logger.debug("[Connect Wallet] Got base64 key, now connecting");
      await connectWithBase64Key({
        address,
        base64Key,
      });

      logger.info("[Connect Wallet] Successfully logged in using a wallet");
      connectViewWalletStore.getState().setOnboardingDone(true);
      logger.debug(
        "[Connect Wallet] ConnectViaWallet initXmtpClient: Function completed successfully"
      );
    } catch (e) {
      logger.error("[Connect Wallet] Error in initXmtpClient:", e);
      connectViewWalletStore
        .getState()
        .setInitiatingClientForAddress(undefined);
      connectViewWalletStore.getState().setLoading(false);
      connectViewWalletStore.getState().setClickedSignature(false);
      connectViewWalletStore.getState().setWaitingForNextSignature(false);
      disconnect().catch(sentryTrackError);
      router.goBack();
    }
  }, [
    address,
    alreadyV3Db,
    disconnect,
    onXmtp,
    signer,
    waitForClickSignature,
    connectViewWalletStore,
    router,
  ]);

  return { initXmtpClient };
}
