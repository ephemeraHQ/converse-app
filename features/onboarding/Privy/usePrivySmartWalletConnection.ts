import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { useEffect, useRef } from "react";

import { initXmtpClientFromViemAccount } from "@components/Onboarding/init-xmtp-client";
import { ensureError, ensureErrorHandler } from "@utils/error";
import logger from "@utils/logger";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { ViemAccount } from "@/utils/xmtpRN/signer";
import { base } from "viem/chains";

export function usePrivySmartWalletConnection(args: {
  onConnectionDone: () => void;
  onConnectionError: (error: Error) => void;
  onStatusChange: (status: string) => void;
}) {
  const { onConnectionDone, onConnectionError, onStatusChange } = args;
  const { isReady: privyIsReady, user: privyUser, logout } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const { client: smartWalletClient } = useSmartWallets();
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
        .catch((error) => {
          logger.error(
            "[Privy connection] Error creating embedded wallet",
            error
          );
          creatingEmbeddedWallet.current = false;
          ensureErrorHandler(onConnectionError)(error);
        });
    }
  }, [
    embeddedWallet,
    privyIsReady,
    privyUser,
    onConnectionError,
    onStatusChange,
  ]);

  useEffect(() => {
    if (!smartWalletClient) {
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
          chainId: smartAccount.client.chain?.id ?? base.id,
          signMessage: async ({ message }) => {
            return smartAccount.signMessage({ message });
          },
        };
        await initXmtpClientFromViemAccount({
          account: viemAccount,
        });
        onStatusChange("Xmtp initialized");
        onConnectionDone();
      } catch (error) {
        logger.error("[Privy connection] Error initializing Xmtp", error);
        onConnectionError(ensureError(error));
      }
    };

    initializeXmtp();
  }, [onConnectionDone, onConnectionError, smartWalletClient, onStatusChange]);

  return {
    privyReady: privyIsReady,
    privyUser,
  };
}
