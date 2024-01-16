import { useDisconnect } from "@web3modal/ethers5/react";

export default function () {
  const disconnectWallet = useDisconnect();
  return disconnectWallet;
}
