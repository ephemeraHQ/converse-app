import "@ethersproject/shims";
import {
  useEmbeddedWallet,
  useLinkWithFarcaster,
  usePrivy,
} from "@privy-io/expo";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
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
  if (!isOnboarding && !currentAccount) {
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
