import { Button } from "@design-system/Button/Button";
import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import logger from "@utils/logger";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { memo, useCallback, useEffect, useRef } from "react";
import { ActivityIndicator } from "react-native";

import { Center } from "../../../design-system/Center";
import { VStack } from "../../../design-system/VStack";
import { spacing } from "../../../theme";
import { useAppTheme } from "../../../theme/useAppTheme";
import { wait } from "../../../utils/general";
import { getXmtpBase64KeyFromSigner } from "../../../utils/xmtpRN/signIn";
import { PictoTitleSubtitle } from "../../PictoTitleSubtitle";
import { Terms } from "../Terms";
import ValueProps from "../ValueProps";
import { connectWithBase64Key } from "../init-xmtp-client";
import {
  ConnectViaWalletContextProvider,
  useConnectViaWalletContext,
} from "./ConnectViaWallet.context";
import {
  ConnectViaWalletStoreProvider,
  useConnectViaWalletStore,
  useConnectViaWalletStoreContext,
} from "./ConnectViaWallet.store";
import { useConnectViaWalletDisconnect } from "./useConnectViaWalletDisconnect";
import { useInitConnectViaWalletState } from "./useInitConnectViaWalletState";

type IConnectViaWalletProps = {
  address: string;
  onDoneConnecting: () => void;
  onErrorConnecting: (arg: { error: Error }) => void;
};

export const ConnectViaWallet = memo(function ConnectViaWallet(
  props: IConnectViaWalletProps
) {
  const { address, onErrorConnecting, onDoneConnecting } = props;

  const disconnect = useConnectViaWalletDisconnect();

  const { alreadyV3Db, isInitializing, onXmtp, signer } =
    useInitConnectViaWalletState({ address });

  const handleDoneConnecting = useCallback(() => {
    onDoneConnecting();
  }, [onDoneConnecting]);

  const handleErrorConnecting = useCallback(
    (arg: { error: Error }) => {
      // When something went wrong, let's be safe and disconnect
      disconnect({ address }).catch(sentryTrackError);
      onErrorConnecting(arg);
    },
    [onErrorConnecting, disconnect, address]
  );

  if (isInitializing) {
    return <ActivityIndicator />;
  }

  if (!signer) {
    // TODO: Empty state something went wrong
    return null;
  }

  return (
    <ConnectViaWalletContextProvider
      onDoneConnecting={handleDoneConnecting}
      onErrorConnecting={handleErrorConnecting}
    >
      <ConnectViaWalletStoreProvider
        address={address}
        alreadyV3Db={alreadyV3Db}
        onXmtp={onXmtp}
        signer={signer}
      >
        <Content />;
      </ConnectViaWalletStoreProvider>
    </ConnectViaWalletContextProvider>
  );
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
    signaturesDone: state.numberOfSignaturesDone,
  }));

  const connectViewWalletStore = useConnectViaWalletStore();

  const { initXmtpClient } = useInitXmptClient();

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

function useInitXmptClient() {
  const { onDoneConnecting, onErrorConnecting } = useConnectViaWalletContext();
  const connectViewWalletStore = useConnectViaWalletStore();
  const disconnect = useConnectViaWalletDisconnect();

  const abortControllerRef = useRef(new AbortController());
  const timeoutInitXmtpClientRef = useRef<NodeJS.Timeout | null>(null);

  const initXmtpClient = useCallback(async () => {
    timeoutInitXmtpClientRef.current = setTimeout(() => {
      sentryTrackMessage(
        "Init XmtpClient via external wallet took more than 30 seconds"
      );
    }, 30000);

    try {
      const signer = connectViewWalletStore.getState().signer!; // We can assume that signer is set at this point
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

      // Used for debugging and know which signature is asked
      const signaturesAsked = {
        create: false,
        enable: false,
        authenticate: false,
      };

      const base64Key = await getXmtpBase64KeyFromSigner(
        signer,
        async () => {
          logger.debug("[Connect Wallet] Installation revoked, disconnecting");
          try {
            await awaitableAlert(
              translate("current_installation_revoked"),
              translate("current_installation_revoked_description")
            );
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
              connectViewWalletStore.getState().numberOfSignaturesDone;

            connectViewWalletStore
              .getState()
              .setNumberOfSignaturesDone(currentSignaturesDone + 1);
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
              connectViewWalletStore.getState().numberOfSignaturesDone;
            connectViewWalletStore
              .getState()
              .setNumberOfSignaturesDone(currentSignaturesDone + 1);
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

      // Restart the state to initial values
      connectViewWalletStore.getState().setLoading(false);
      connectViewWalletStore.getState().setClickedSignature(false);
      connectViewWalletStore.getState().setWaitingForNextSignature(false);
      connectViewWalletStore.getState().setNumberOfSignaturesDone(0);
    }
  }, [connectViewWalletStore, onDoneConnecting, onErrorConnecting]);

  useEffect(() => {
    const currentAbortController = abortControllerRef.current;

    return () => {
      if (timeoutInitXmtpClientRef.current) {
        clearTimeout(timeoutInitXmtpClientRef.current);
      }

      // To leave the while loop waiting for signature
      currentAbortController.abort();
    };
  }, []);

  return { initXmtpClient };
}
