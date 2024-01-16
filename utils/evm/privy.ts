import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { ethers } from "ethers";
import "@ethersproject/shims";
import { useState } from "react";

import config from "../../config";
import {
  useAccountsStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";

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
        .catch(console.error);
    } else {
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const ethersSigner = ethersProvider.getSigner();
      return ethersSigner;
    }
  }
  return undefined;
};
