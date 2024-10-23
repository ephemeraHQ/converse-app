import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "@utils/logger";
import { logoutAccount } from "@utils/logout";
import { useCallback } from "react";
import { useActiveWallet as useThirdwebActiveWallet } from "thirdweb/react";

// Keep as a hook for now because we need to use thirdweb hooks
// Didn't find ways to manage active wallet outside React
export function useConnectViaWalletDisconnect() {
  const thirdwebWallet = useThirdwebActiveWallet();

  return useCallback(
    async (args: { address: string }) => {
      const { address } = args;

      logger.debug("[Connect Wallet] Disconnecting");

      if (address) {
        logger.debug(`[Connect Wallet] Logging out address ${address}`);
        logoutAccount(address, false, true, () => {});
      }

      if (thirdwebWallet) {
        logger.debug("[Connect Wallet] Disconnecting thirdweb wallet");
        thirdwebWallet.disconnect();
      }

      logger.debug("[Connect Wallet] Removing wc@2 keys from AsyncStorage");
      const storageKeys = await AsyncStorage.getAllKeys();
      const wcKeys = storageKeys.filter((k) => k.startsWith("wc@2:"));
      await AsyncStorage.multiRemove(wcKeys);

      logger.debug("[Connect Wallet] Disconnected");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thirdwebWallet]
  );
}
