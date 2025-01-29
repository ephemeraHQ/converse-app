import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { usePrivySigner } from "@utils/evm/privy";
import { useEffect, useRef } from "react";

import { usePrivyAuthStoreContext } from "./privyAuthStore";
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
  const privyAccountId = usePrivyAuthStoreContext(
    (state) => state.privyAccountId
  );
  usePrivySigner({
    isOnboarding: true,
  });
  const creatingEmbeddedWallet = useRef(false);
  const initializingXmtp = useRef(false);

  logger.debug(
    `[usePrivySmartWalletConnection] Initializing hook with privyIsReady: ${privyIsReady}, privyAccountId: ${privyAccountId}`
  );

  // Let's make sure we start with a clean state
  useEffect(() => {
    logger.debug(
      "[usePrivySmartWalletConnection] Starting clean state - logging out --- why the hell were we logging out?"
    );
    // logout();
    logger.debug("[usePrivySmartWalletConnection] Logout completed");
  }, []);

  // To make sure that we have a wallet created
  useEffect(() => {
    logger.debug(
      `[usePrivySmartWalletConnection] Checking wallet creation conditions - privyIsReady: ${privyIsReady}, embeddedWallet.status: ${embeddedWallet.status}`
    );

    if (!privyIsReady || !privyUser) {
      logger.debug(
        "[usePrivySmartWalletConnection] Privy not ready or no user - skipping wallet creation"
      );
      return;
    }

    if (embeddedWallet.status !== "not-created") {
      logger.debug(
        `[usePrivySmartWalletConnection] Embedded wallet status is ${embeddedWallet.status} - skipping creation`
      );
      return;
    }

    if (!creatingEmbeddedWallet.current) {
      creatingEmbeddedWallet.current = true;
      onStatusChange("Creating embedded wallet");
      logger.debug(
        "[usePrivySmartWalletConnection] Starting embedded wallet creation process"
      );

      if (smartWalletClient?.account) {
        logger.debug(
          `[usePrivySmartWalletConnection] Smart wallet already exists at address: ${smartWalletClient.account.address}`
        );
        return;
      }

      const userWallets = privyUser.linked_accounts.filter(
        (account) => account.type === "wallet"
      );
      const smartWallets = privyUser.linked_accounts.filter(
        (account) => account.type === "smart_wallet"
      );

      logger.debug("[usePrivySmartWalletConnection] Current wallet state:", {
        userWallets: JSON.stringify(userWallets, null, 2),
        smartWallets: JSON.stringify(smartWallets, null, 2),
      });

      if (smartWallets.length === 0) {
        logger.debug(
          "[usePrivySmartWalletConnection] No smart wallets found, initiating creation"
        );
        embeddedWallet
          .create()
          .then(() => {
            logger.debug(
              "[usePrivySmartWalletConnection] Successfully created embedded wallet"
            );
          })
          .catch((error) => {
            logger.error(
              "[usePrivySmartWalletConnection] Failed to create embedded wallet:",
              {
                error: JSON.stringify(error, null, 2),
              }
            );
            creatingEmbeddedWallet.current = false;
            ensureErrorHandler(onConnectionError)(error);
          });
      }
    }
  }, [
    embeddedWallet,
    privyIsReady,
    privyUser,
    onConnectionError,
    onStatusChange,
    smartWalletClient?.account,
  ]);

  useEffect(() => {
    logger.debug(
      `[usePrivySmartWalletConnection] Checking XMTP initialization conditions - smartWalletClient exists: ${!!smartWalletClient}, privyAccountId: ${privyAccountId}`
    );

    if (!smartWalletClient || !privyAccountId || initializingXmtp.current) {
      return;
    }

    const initializeXmtp = async () => {
      try {
        logger.debug(
          "[usePrivySmartWalletConnection] Starting XMTP initialization"
        );
        initializingXmtp.current = true;
        onStatusChange("Initializing Xmtp with Smart Wallet");

        const smartAccount = smartWalletClient?.account;

        if (!smartAccount) {
          logger.error(
            "[usePrivySmartWalletConnection] No smart account found during XMTP initialization"
          );
          throw new Error("No smart account found");
        }

        logger.debug(
          `[usePrivySmartWalletConnection] Creating Viem account with address: ${
            smartAccount.address
          }, chainId: ${smartAccount.client.chain?.id ?? base.id}`
        );

        const viemAccount: ViemAccount = {
          address: smartAccount.address,
          chainId: smartAccount.client.chain?.id ?? base.id,
          signMessage: async ({ message }) => {
            logger.debug(
              "[usePrivySmartWalletConnection] Signing message with smart account",
              { message }
            );
            return smartAccount.signMessage({ message });
          },
        };

        logger.debug(
          "[usePrivySmartWalletConnection] Initializing XMTP client with Viem account"
        );
        await initXmtpClientFromViemAccount({
          account: viemAccount,
          privyAccountId,
        });

        logger.debug(
          "[usePrivySmartWalletConnection] Successfully initialized XMTP client"
        );
        onStatusChange("Xmtp initialized");
        onConnectionDone();
      } catch (error) {
        logger.error(
          "[usePrivySmartWalletConnection] Failed to initialize XMTP:",
          {
            error: JSON.stringify(error, null, 2),
          }
        );
        onConnectionError(ensureError(error));
      }
    };

    logger.debug(
      "[usePrivySmartWalletConnection] Initializing XMTP with smart wallet"
    );

    initializeXmtp();
  }, [
    privyAccountId,
    onConnectionDone,
    onConnectionError,
    smartWalletClient,
    onStatusChange,
  ]);

  return {
    privyReady: privyIsReady,
    privyUser,
    privyAccountId,
  };
}
