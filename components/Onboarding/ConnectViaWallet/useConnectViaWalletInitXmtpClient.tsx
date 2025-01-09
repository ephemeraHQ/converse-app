import { translate } from "@i18n";
import { useRouter } from "@navigation/useNavigation";
import { awaitableAlert } from "@utils/alert";
import { ensureError } from "@utils/error";
import logger from "@utils/logger";
import { sentryTrackError, sentryTrackMessage } from "@utils/sentry";
import { reloadAsync } from "expo-updates";
import { useCallback, useEffect, useRef } from "react";

import { createXmtpClientFromSigner } from "../../../utils/xmtpRN/signIn";
import { connectWithInboxId } from "../init-xmtp-client";
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

      logger.debug("[Connect Wallet] starting initXmtpClient");

      hasStartedXmtpClientFlowRef.current = true;

      const handleInstallationRevoked = async () => {
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
      };

      const preAuthenticateToInboxCallback = async () => {
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
      };

      const xmtpClientCreationResult = await createXmtpClientFromSigner(
        signer,
        handleInstallationRevoked,
        preAuthenticateToInboxCallback
      );

      if ("error" in xmtpClientCreationResult) {
        onErrorConnecting({
          error: xmtpClientCreationResult.error,
        });
        return;
      }

      const inboxId = xmtpClientCreationResult.inboxId;

      await connectWithInboxId({
        inboxId,
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
