import { useActiveWallet, useDisconnect } from "thirdweb/react";

export const useDisconnectWallet = () => {
  const { disconnect: disconnectWallet } = useDisconnect();
  const activeWallet = useActiveWallet();
  return () => {
    if (activeWallet) {
      disconnectWallet(activeWallet);
    }
  };
};
