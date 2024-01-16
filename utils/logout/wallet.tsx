import { useDisconnect } from "@thirdweb-dev/react-native";

export const useDisconnectWallet = () => {
  const disconnectWallet = useDisconnect();
  return disconnectWallet;
};
