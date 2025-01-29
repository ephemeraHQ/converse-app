import "@ethersproject/shims";
import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { ethers } from "ethers";
import { useState } from "react";
import { config } from "../../config";
import { useCurrentAccount } from "../../data/store/accountsStore";

import logger from "@utils/logger";

type IPrivySignerParams = {
  isOnboarding: boolean;
};

export const usePrivySigner = (
  params: IPrivySignerParams = { isOnboarding: false }
) => {
  const { isOnboarding = false } = params;
  const currentAccount = useCurrentAccount();
  const { isReady: privyReady, user: privyUser } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const [hasSwitchedNetwork, setHasSwitchedNetwork] = useState(false);

  logger.debug(
    `[usePrivySigner] State: ${JSON.stringify(
      {
        isOnboarding,
        hasCurrentAccount: !!currentAccount,
        privyReady,
        privyUserId: privyUser?.id,
        embeddedWalletStatus: embeddedWallet.status,
        hasSwitchedNetwork,
      },
      null,
      2
    )}`
  );

  if (!isOnboarding && !currentAccount) {
    logger.debug(
      "[usePrivySigner] No current account during non-onboarding state"
    );
    return undefined;
  }

  if (privyReady && privyUser && embeddedWallet.status === "connected") {
    logger.debug("[usePrivySigner] Privy and embedded wallet ready");
    const provider = embeddedWallet.provider;

    if (!hasSwitchedNetwork) {
      logger.debug(
        `[usePrivySigner] Switching network to chainId: ${config.evm.transactionChainId}`
      );

      provider
        .request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: config.evm.transactionChainId }],
        })
        .then(() => {
          logger.debug("[usePrivySigner] Successfully switched network");
          setHasSwitchedNetwork(true);
        })
        .catch((error) => {
          logger.error(
            `[usePrivySigner] Failed to switch network: ${JSON.stringify(
              error,
              null,
              2
            )}`
          );
        });
    } else {
      logger.debug("[usePrivySigner] Creating ethers provider and signer");
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const ethersSigner = ethersProvider.getSigner();
      return ethersSigner;
    }
  }

  logger.debug("[usePrivySigner] Conditions not met for signer creation");
  return undefined;
};
