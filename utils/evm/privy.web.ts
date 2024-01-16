import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Signer } from "ethers";
import "@ethersproject/shims";
import { useCallback, useState } from "react";

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
