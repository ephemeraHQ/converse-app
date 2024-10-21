import {
  useEmbeddedWallet,
  useLinkWithFarcaster,
  usePrivy,
} from "@privy-io/expo";
import { ethers } from "ethers";
import "@ethersproject/shims";
import { useEffect, useState } from "react";

import config from "../../config";

import {
  useAccountsStore,
  useCurrentAccount,
} from "@features/accounts/accounts.store";
import logger from "@utils/logger";

export const usePrivySigner = (onboarding: boolean = false) => {
  const currentAccount = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);
  const { isReady: privyReady, user: privyUser } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const [hasSwitchedNetwork, setHasSwitchedNetwork] = useState(false);
  if (!onboarding && (!currentAccount || !privyAccountId[currentAccount])) {
    // Except during onboarding, we need to be
    // logged in a privy account to access a privy signer
    return undefined;
  }
  if (privyReady && privyUser && embeddedWallet.status === "connected") {
    const provider = embeddedWallet.provider;
    if (!hasSwitchedNetwork) {
      provider
        .request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: config.evm.transactionChainId }],
        })
        .then(() => {
          setHasSwitchedNetwork(true);
        })
        .catch(logger.error);
    } else {
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const ethersSigner = ethersProvider.getSigner();
      return ethersSigner;
    }
  }
  return undefined;
};

let privyAccessToken: string | null;

export const usePrivyAccessToken = () => {
  const [accessToken, setAccessToken] = useState(null as string | null);
  const { getAccessToken, user, isReady } = usePrivy();
  useEffect(() => {
    if (!isReady) return;
    getAccessToken?.()
      .then((token) => {
        privyAccessToken = token;
        setAccessToken(token);
      })
      .catch((e) => {
        logger.error(e, { context: "error getting privy access token" });
      });
  }, [getAccessToken, user?.id, isReady]);
  return accessToken;
};

export const getPrivyRequestHeaders = () => ({
  "privy-access-token": privyAccessToken,
});

export const useLinkFarcaster = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: any) => void;
}) => {
  const { linkWithFarcaster } = useLinkWithFarcaster({
    onSuccess,
    onError,
  });
  return linkWithFarcaster;
};
