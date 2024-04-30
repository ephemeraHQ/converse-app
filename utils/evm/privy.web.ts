import { useLinkAccount, usePrivy, useWallets } from "@privy-io/react-auth";
import { Signer } from "ethers";
import "@ethersproject/shims";
import { useCallback, useEffect, useState } from "react";

import config from "../../config";
import {
  useAccountsStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";

export const usePrivySigner = (onboarding: boolean = false) => {
  const currentAccount = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);
  const { ready: privyReady, user: privyUser } = usePrivy();
  const { wallets } = useWallets();
  const privyEmbeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const [hasSwitchedNetwork, setHasSwitchedNetwork] = useState(false);
  const [privySigner, setPrivySigner] = useState<Signer | undefined>(undefined);

  const setupSigner = useCallback(async () => {
    if (!privyEmbeddedWallet) return;
    const connected = await privyEmbeddedWallet.isConnected();
    if (!connected) return;
    const provider = await privyEmbeddedWallet.getEthersProvider();
    if (!hasSwitchedNetwork) {
      await privyEmbeddedWallet.switchChain(
        config.evm.transactionChainId as `0x${string}`
      );
      setHasSwitchedNetwork(true);
    }
    const signer = provider.getSigner();
    setPrivySigner(signer);
  }, [hasSwitchedNetwork, privyEmbeddedWallet]);

  if (!onboarding && (!currentAccount || !privyAccountId[currentAccount])) {
    // Except during onboarding, we need to be
    // logged in a privy account to access a privy signer
    return undefined;
  }
  if (privySigner) {
    return privySigner;
  }

  if (privyReady && privyUser && privyEmbeddedWallet) {
    setupSigner();
  }
  return undefined;
};

let privyAccessToken: string | null;

export const usePrivyAccessToken = () => {
  const [accessToken, setAccessToken] = useState(null as string | null);
  const { getAccessToken } = usePrivy();
  useEffect(() => {
    getAccessToken().then((token) => {
      privyAccessToken = token;
      setAccessToken(token);
    });
  }, [getAccessToken]);
  return accessToken;
};

export const useLinkFarcaster = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: any) => void;
}) => {
  const { user } = usePrivy();
  const { linkFarcaster } = useLinkAccount({ onSuccess, onError });
  return () => {
    if (user?.farcaster) {
      onSuccess();
      return;
    }
    linkFarcaster();
  };
};

export const getPrivyRequestHeaders = () => ({
  "privy-access-token": privyAccessToken,
});
