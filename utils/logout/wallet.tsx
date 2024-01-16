import { useDisconnect } from "@thirdweb-dev/react-native";

export default function () {
  const disconnectWallet = useDisconnect();
  return disconnectWallet;
}
