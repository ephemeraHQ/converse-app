import { translate } from "@i18n";
import { useRouter } from "@navigation/useNavigation";
import { awaitableAlert } from "@utils/alert";
import { ensureError } from "@utils/error";
import logger from "@utils/logger";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { reloadAsync } from "expo-updates";
import { useCallback, useEffect, useRef } from "react";

import { wait } from "../../../utils/general";
import { getXmtpBase64KeyFromSigner } from "../../../utils/xmtpRN/signIn";
import { connectWithBase64Key } from "../init-xmtp-client";
import { useConnectViaWalletContext } from "./ConnectViaWallet.context";
import { useConnectViaWalletStore } from "./ConnectViaWallet.store";

export function useInitXmptClient() {
  const { onDoneConnecting, onErrorConnecting } = useConnectViaWalletContext();
  const connectViewWalletStore = useConnectViaWalletStore();

  const abortControllerRef = useRef(new AbortController());
  const timeoutInitXmtpClientRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedXmtpClientFlowRef = useRef(false);
  const hasFinishedXmtpClientFlowRef = useRef(false);

  useRouter({
    onBeforeRemove() {
      /*
        Pretty edge case where user has started the XMTP flow 
        i.e. user has done at least one signature but then decides
        to leave before going to the end of the flow. The XMTP SDK
        gets into a broken state
        */
      if (
        hasStartedXmtpClientFlowRef.current &&
        !hasFinishedXmtpClientFlowRef.current
      ) {
        logger.debug(
          "[Connect Wallet] User left the XMTP flow before finishing, reloading the app"
        );
        reloadAsync().catch(sentryTrackError);
      }
    },
  });

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

      const waitForClickSignature = async () => {
        while (!connectViewWalletStore.getState().clickedSignature) {
          if (abortControllerRef.current.signal.aborted) {
            return;
          }
          logger.debug("[Connect Wallet] Waiting for clicked signature");
          await wait(1000);
        }
      };

      logger.debug("[Connect Wallet] starting initXmtpClient");

      hasStartedXmtpClientFlowRef.current = true;

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
          logger.debug("[Connect Wallet] Triggering create signature");
          // Before calling "create" signature
          connectViewWalletStore.getState().setWaitingForNextSignature(true);
          connectViewWalletStore.getState().setClickedSignature(false);
        },
        async () => {
          // Before calling "enable" signature
          const waitingForNextSignature =
            connectViewWalletStore.getState().waitingForNextSignature;

          if (waitingForNextSignature) {
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

      hasFinishedXmtpClientFlowRef.current = true;

      onDoneConnecting();
    } catch (error: unknown) {
      logger.error("[Connect Wallet] Error in initXmtpClient:", error);
      onErrorConnecting({
        error: ensureError(error),
      });
    } finally {
      hasStartedXmtpClientFlowRef.current = false;
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
