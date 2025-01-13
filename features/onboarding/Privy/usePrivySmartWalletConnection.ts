import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { usePrivyAccessToken, usePrivySigner } from "@utils/evm/privy";
import { useEffect, useRef } from "react";

import { usePrivyAuthStoreContext } from "./privyAuthStore";
import { initXmtpClientFromViemAccount } from "@components/Onboarding/init-xmtp-client";
import { ensureError, ensureErrorHandler } from "@utils/error";
import logger from "@utils/logger";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { ViemAccount } from "@/utils/xmtpRN/signer";
import config from "@/config";

export function usePrivySmartWalletConnection(args: {
  onConnectionDone: () => void;
  onConnectionError: (error: Error) => void;
  onStatusChange: (status: string) => void;
}) {
  const { onConnectionDone, onConnectionError, onStatusChange } = args;
  const { isReady: privyIsReady, user: privyUser, logout } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const { client: smartWalletClient } = useSmartWallets();
  const privyAccountId = usePrivyAuthStoreContext(
    (state) => state.privyAccountId
  );
  usePrivySigner(true);
  const privyAccessToken = usePrivyAccessToken();
  const creatingEmbeddedWallet = useRef(false);
  const initializingXmtp = useRef(false);

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
      onStatusChange("Creating embedded wallet");
      logger.debug("[Privy connection] Creating embedded wallet");
      embeddedWallet
        .create()
        // TODO: Handle better error
        .catch(ensureErrorHandler(onConnectionError));
    }
  }, [
    embeddedWallet,
    privyIsReady,
    privyUser,
    onConnectionError,
    onStatusChange,
  ]);

  useEffect(() => {
    if (!smartWalletClient || !privyAccessToken || !privyAccountId) {
      return;
    }

    const initializeXmtp = async () => {
      try {
        if (initializingXmtp.current) {
          return;
        }
        initializingXmtp.current = true;
        onStatusChange("Initializing Xmtp with Smart Wallet");
        const smartAccount = smartWalletClient?.account;

        if (!smartAccount) {
          throw new Error("No smart account found");
        }

        const viemAccount: ViemAccount = {
          address: smartAccount.address,
          chainId:
            smartAccount.client.chain?.id ?? config.privy.defaultChain.id,
          signMessage: async ({ message }) => {
            return smartAccount.signMessage({ message });
          },
        };
        await initXmtpClientFromViemAccount({
          account: viemAccount,
          privyAccountId,
        });
        onStatusChange("Xmtp initialized");
        onConnectionDone();
      } catch (error) {
        onConnectionError(ensureError(error));
      }
    };

    initializeXmtp();
  }, [
    privyAccessToken,
    privyAccountId,
    onConnectionDone,
    onConnectionError,
    smartWalletClient,
    onStatusChange,
  ]);

  return {
    privyReady: privyIsReady,
    privyUser,
    privyAccessToken,
    privyAccountId,
  };
}
