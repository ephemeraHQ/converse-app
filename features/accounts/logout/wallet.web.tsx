import { useDisconnect } from "@web3modal/ethers5/react";

export const useDisconnectWallet = () => {
  const { disconnect } = useDisconnect();
  return disconnect;
};
