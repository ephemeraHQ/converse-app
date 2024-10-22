import { Button } from "@design-system/Button/Button";
import { translate } from "@i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { awaitableAlert } from "@utils/alert";
import { getDatabaseFilesForInboxId } from "@utils/fileSystem";
import logger from "@utils/logger";
import { logoutAccount } from "@utils/logout";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";

import { Center } from "../../../design-system/Center";
import { VStack } from "../../../design-system/VStack";
import { spacing } from "../../../theme";
import { useAppTheme } from "../../../theme/useAppTheme";
import { wait } from "../../../utils/general";
import { isOnXmtp } from "../../../utils/xmtpRN/client";
import {
  getInboxId,
  getXmtpBase64KeyFromSigner,
} from "../../../utils/xmtpRN/signIn";
import { PictoTitleSubtitle } from "../../PictoTitleSubtitle";
import { Terms } from "../Terms";
import ValueProps from "../ValueProps";
import { connectWithBase64Key } from "../init-xmtp-client";
import { useConnectViaWalletContext } from "./ConnectViaWallet.context";
import {
  useConnectViaWalletStore,
  useConnectViaWalletStoreContext,
} from "./ConnectViaWallet.store";

export const ConnectViaWallet = memo(function ConnectViaWallet() {
  const { isInitializing } = useInitSignerState();

  if (isInitializing) {
    return <ActivityIndicator />;
  }

  return <Content />;
});

const Content = memo(function Content() {
  const { theme } = useAppTheme();

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

  const { initXmtpClient } = useXmtpConnection();

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

  // Random for now until we have a better solution
  if (loading) {
    return (
      <Center
        style={{
          paddingTop: theme.spacing["6xl"],
        }}
      >
        <ActivityIndicator />
      </Center>
    );
  }

  // Determine the content based on the state
  let title = "";
  let subtitle = "";
  let showValueProps = true;

  // console.log("onXmtp:", onXmtp);
  // console.log("alreadyV3Db:", alreadyV3Db);
  // console.log("signaturesDone:", signaturesDone);
  // console.log("waitingForNextSignature:", waitingForNextSignature);
  // console.log("loading:", loading);

  // On XMTP, needs V3 DB signature
  if (onXmtp && !alreadyV3Db) {
    title = `${translate("connectViaWallet.sign")} (${signaturesDone + 1}/2)`;
    subtitle = translate("connectViaWallet.firstSignature.explanation");
  }
  // On XMTP, has V3 DB signature
  else if (onXmtp && alreadyV3Db) {
    title = translate("connectViaWallet.firstSignature.title");
    subtitle = translate("connectViaWallet.secondSignature.explanation");
  }
  // Waiting for second signature
  else if (waitingForNextSignature && !loading) {
    title = translate("connectViaWallet.secondSignature.title");
    subtitle = translate("connectViaWallet.secondSignature.explanation");
    showValueProps = false;
  }
  // Not on XMTP, needs first signature
  else {
    title = translate("connectViaWallet.firstSignature.title");
    subtitle = translate("connectViaWallet.firstSignature.explanation");
  }

  return (
    <>
      <PictoTitleSubtitle.Container
        // Not best to add those style here but okay for now until NewAccount and Onboarding have their own flow
        style={{
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
        }}
      >
        <PictoTitleSubtitle.Picto picto="tray" />
        <PictoTitleSubtitle.Title>{title}</PictoTitleSubtitle.Title>
        <PictoTitleSubtitle.Subtitle>{subtitle}</PictoTitleSubtitle.Subtitle>
      </PictoTitleSubtitle.Container>
      {showValueProps && <ValueProps />}
      <VStack
        style={{
          rowGap: spacing.sm,
          marginTop: spacing.lg,
        }}
      >
        <Button
          loading={loading}
          onPress={primaryButtonAction}
          text={translate("connectViaWallet.sign")}
        />
        <Terms />
      </VStack>
    </>
  );
});

function useInitSignerState() {
  const signer = useConnectViaWalletStoreContext((state) => state.signer);

  const [isInitializing, setIsInitializing] = useState(true);

  const connectViewWalletStore = useConnectViaWalletStore();

  // Init stuff based on signer
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        setIsInitializing(true);

        const [address, isOnNetwork, inboxId] = await Promise.all([
          signer.getAddress(),
          isOnXmtp(await signer.getAddress()),
          getInboxId(await signer.getAddress()),
        ]);

        const v3Dbs = await getDatabaseFilesForInboxId(inboxId);
        const hasV3 = v3Dbs.filter((n) => n.name.endsWith(".db3")).length > 0;

        connectViewWalletStore.getState().setOnXmtp(isOnNetwork);
        connectViewWalletStore.getState().setAlreadyV3Db(hasV3);
        connectViewWalletStore.getState().setAddress(address);

        logger.debug(
          `[Connect Wallet] User connected wallet (${address}). ${
            isOnNetwork ? "Already" : "Not yet"
          } on XMTP. V3 database ${hasV3 ? "already" : "not"} present`
        );
      } catch (error) {
        logger.error("Error initializing wallet:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeWallet();
  }, [signer, connectViewWalletStore, setIsInitializing]);

  return { isInitializing };
}

function useDisconnect() {
  const connectViewWalletStore = useConnectViaWalletStore();

  return useCallback(
    async () => {
      logger.debug("[Connect Wallet] Logging out");

      const address = connectViewWalletStore.getState().address;

      if (address) {
        logoutAccount(address, false, true, () => {});
      }

      const storageKeys = await AsyncStorage.getAllKeys();
      const wcKeys = storageKeys.filter((k) => k.startsWith("wc@2:"));
      await AsyncStorage.multiRemove(wcKeys);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}

function useXmtpConnection() {
  const { onDoneConnecting, onErrorConnecting } = useConnectViaWalletContext();
  const connectViewWalletStore = useConnectViaWalletStore();
  const inXmtpClientCreationFlow = useRef(false);
  const disconnect = useDisconnect();

  const abortControllerRef = useRef(new AbortController());
  const timeoutInitXmtpClientRef = useRef<NodeJS.Timeout | null>(null);

  const initXmtpClient = useCallback(async () => {
    timeoutInitXmtpClientRef.current = setTimeout(() => {
      sentryTrackMessage(
        "Init XmtpClient via external wallet took more than 30 seconds"
      );
    }, 30000);

    try {
      const signer = connectViewWalletStore.getState().signer;
      const address = connectViewWalletStore.getState().address!; // We can assume that address is set at this point
      const onXmtp = connectViewWalletStore.getState().onXmtp;
      const alreadyV3Db = connectViewWalletStore.getState().alreadyV3Db;

      logger.debug("[Connect Wallet] starting initXmtpClient");

      // Not sure we need this
      // if (
      //   connectViewWalletStore.getState().initiatingClientForAddress === address
      // ) {
      //   throw new Error("Already initiating client for this address");
      // }

      // Not sure we need this
      // connectViewWalletStore.getState().setInitiatingClientForAddress(address);

      const waitForClickSignature = async () => {
        while (!connectViewWalletStore.getState().clickedSignature) {
          if (abortControllerRef.current.signal.aborted) {
            throw new Error("Operation aborted");
          }
          logger.debug(
            "[Connect Wallet] Waiting for signature. Current clickedSignature value: false"
          );
          await wait(1000);
        }
      };

      // Not sure why we have this?
      const signaturesAsked = {
        create: false,
        enable: false,
        authenticate: false,
      };

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
            onErrorConnecting({
              error: new Error("Installation revoked"),
            });
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
          } else {
            logger.debug("[Connect Wallet] not waiting for next signature");
          }

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
        throw new Error("[Connect Wallet] No base64Key received");
      }

      logger.debug("[Connect Wallet] Got base64 key, now connecting");

      await connectWithBase64Key({
        address,
        base64Key,
      });

      logger.info("[Connect Wallet] Successfully logged in using a wallet");

      onDoneConnecting();
    } catch (error: unknown) {
      logger.error("[Connect Wallet] Error in initXmtpClient:", error);
      onErrorConnecting({
        error:
          error instanceof Error
            ? error
            : typeof error === "string"
            ? new Error(error)
            : new Error("Something went wrong"),
      });
    } finally {
      clearTimeout(timeoutInitXmtpClientRef.current);

      // Not sure we need this
      // connectViewWalletStore
      //   .getState()
      //   .setInitiatingClientForAddress(undefined);

      // Restart the state to initial values
      connectViewWalletStore.getState().setLoading(false);
      connectViewWalletStore.getState().setClickedSignature(false);
      connectViewWalletStore.getState().setWaitingForNextSignature(false);
      connectViewWalletStore.getState().setSignaturesDone(0);
    }
  }, [disconnect, connectViewWalletStore, onDoneConnecting, onErrorConnecting]);

  useEffect(() => {
    const currentAbortController = abortControllerRef.current;

    return () => {
      if (timeoutInitXmtpClientRef.current) {
        clearTimeout(timeoutInitXmtpClientRef.current);
      }

      // Making sure we clean everything when leaving the screen
      disconnect();

      // To leave the while loop waiting for signature
      currentAbortController.abort();
    };
  }, [disconnect]);

  return { initXmtpClient };
}
