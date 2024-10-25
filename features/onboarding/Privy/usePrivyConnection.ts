import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { usePrivyAccessToken, usePrivySigner } from "@utils/evm/privy";
import { useEffect, useRef } from "react";

import { usePrivyAuthStoreContext } from "./privyAuthStore";
import { initXmtpClient } from "../../../components/Onboarding/init-xmtp-client";
import { ensureError, ensureErrorHandler } from "../../../utils/error";
import logger from "../../../utils/logger";

export function usePrivyConnection(args: {
  onConnectionDone: () => void;
  onConnectionError: (error: Error) => void;
}) {
  const { onConnectionDone, onConnectionError } = args;
  const { isReady: privyIsReady, user: privyUser, logout } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const privyAccountId = usePrivyAuthStoreContext(
    (state) => state.privyAccountId
  );
  const privySigner = usePrivySigner(true);
  const privyAccessToken = usePrivyAccessToken();
  const creatingEmbeddedWallet = useRef(false);

  // Let's make sure we start with a clean state
  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // To make sure that we have a wallet created
  useEffect(() => {
    if (!privyIsReady || !privyUser) {
      return;
    }

    if (embeddedWallet.status !== "not-created") {
      return;
    }

    if (!creatingEmbeddedWallet.current) {
      creatingEmbeddedWallet.current = true;
      logger.debug("[Privy connection] Creating embedded wallet");
      embeddedWallet
        .create()
        // TODO: Handle better error
        .catch(ensureErrorHandler(onConnectionError));
    }
  }, [embeddedWallet, privyIsReady, privyUser, onConnectionError]);

  useEffect(() => {
    if (!privySigner || !privyAccessToken || !privyAccountId) {
      return;
    }

    const initializeXmtp = async () => {
      logger.debug("[Privy connection] Initializing Xmtp");
      try {
        await initXmtpClient({
          signer: privySigner,
          address: await privySigner.getAddress(),
          privyAccountId,
        });
        onConnectionDone();
      } catch (error) {
        onConnectionError(ensureError(error));
      }
    };

    initializeXmtp();
  }, [
    privyAccessToken,
    privyAccountId,
    privySigner,
    onConnectionDone,
    onConnectionError,
  ]);

  return {
    privyReady: privyIsReady,
    privyUser,
    privySigner,
    privyAccessToken,
    privyAccountId,
  };
}
