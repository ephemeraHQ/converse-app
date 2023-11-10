import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { Signer, ethers } from "ethers";
import { useState } from "react";

import config from "../config";
import {
  useAccountsStore,
  useCurrentAccount,
} from "../data/store/accountsStore";
import { pick } from "./objects";

export const sendEther = async (
  signer: Signer,
  amountInEther: string,
  receiverAddress: string
) => {
  // const tx: ethers.providers.TransactionRequest = {
  //   to: receiverAddress,
  //   // Convert currency unit from ether to wei
  //   value: ethers.utils.parseEther(amountInEther),
  //   gasLimit: ethers.utils.parseEther(amountInEther),
  // };
  // signer.sendTransaction(tx).then((txObj) => {
  //   console.log("txHash", txObj.hash);
  //   // => 0x9c172314a693b94853b49dc057cf1cb8e529f29ce0272f451eea8f5741aa9b58
  //   // A transaction result can be checked in a etherscan with a transaction hash which can be obtained here.
  // });
};

export const getETHBalance = async (signer: Signer) => {
  const balance = await signer.getBalance();
  return ethers.utils.formatEther(balance);
};

export const usePrivySigner = (onboarding: boolean = false) => {
  const currentAccount = useCurrentAccount();
  const { privyAccountId } = useAccountsStore((s) =>
    pick(s, ["privyAccountId"])
  );
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
          params: [{ chainId: config.privyChainId }],
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
