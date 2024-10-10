import { useActiveWallet, useDisconnect } from "thirdweb/react";

export const useDisconnectWallet = () => {
  const { disconnect: disconnectWallet } = useDisconnect();
  const thirdwebWallet = useActiveWallet();
  return () => {
    if (thirdwebWallet) {
      disconnectWallet(thirdwebWallet);
    }
  };
};
