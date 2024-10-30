import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import logger from "@utils/logger";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { useCallback, useEffect, useRef } from "react";

import { wait } from "../../../utils/general";
import { signInUsingSigner } from "../../../utils/xmtpRN/signIn";
import { finalizeWalletXMTPOnboarding } from "../init-xmtp-client";
import { useConnectViaWalletContext } from "./ConnectViaWallet.context";
import { useConnectViaWalletStore } from "./ConnectViaWallet.store";

export function useInitXmptClient() {
  const { onDoneConnecting, onErrorConnecting } = useConnectViaWalletContext();
  const connectViewWalletStore = useConnectViaWalletStore();

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
      const isSCW = connectViewWalletStore.getState().isSCW;
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

      const xmtpV2Key = await signInUsingSigner({
        signer,
        isSCW,
        onInstallationRevoked: async () => {
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
        preCreateIdentityCallback: async () => {
          signaturesAsked.create = true;
          logger.debug("[Connect Wallet] Triggering create signature");
          // Before calling "create" signature
          connectViewWalletStore.getState().setWaitingForNextSignature(true);
          connectViewWalletStore.getState().setClickedSignature(false);
        },
        preEnableIdentityCallback: async () => {
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
        preAuthenticateToInboxCallback: async () => {
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
        },
      });

      if (!xmtpV2Key && !isSCW) {
        throw new Error("[Connect Wallet] EOA expects to get back a v2 key");
      }

      await finalizeWalletXMTPOnboarding({
        address,
        v2Key: xmtpV2Key,
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
