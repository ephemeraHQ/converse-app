import { EmbeddedWalletState } from "@privy-io/expo";
import { ethers } from "ethers";

import config from "../config";

export const getPrivySigner = async (embeddedWallet: EmbeddedWalletState) => {
  if (!embeddedWallet || embeddedWallet.status !== "connected")
    return undefined;
  const provider = embeddedWallet.provider;
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: config.privyChainId }],
  });
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const ethersSigner = ethersProvider.getSigner();
  return ethersSigner;
};
