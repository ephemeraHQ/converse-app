import { usePrivy } from "@privy-io/expo";
import { useCallback } from "react";
import { useAuthStore } from "@/features/authentication/authentication.store";
import { resetAccountStore } from "@/features/authentication/multi-inbox.store";
import { queryClient } from "@/queries/queryClient";
import { reactQueryMMKV, secureQueryMMKV } from "@/utils/mmkv";
import { logger } from "../../utils/logger";

export const useLogout = () => {
  const privy = usePrivy();

  const logout = useCallback(async () => {
    logger.debug("[useLogout] Logging out invoked");
    try {
      useAuthStore.getState().actions.setStatus("signedOut");

      await privy.logout();

      resetAccountStore();

      // Clear both in-memory cache and persisted data
      queryClient.getQueryCache().clear();
      queryClient.clear();
      queryClient.removeQueries();
      reactQueryMMKV.clearAll();
      secureQueryMMKV.clearAll();

      logger.debug(
        `[useLogout] Privy, account store, query client, mmkv cleared successfully`,
      );
    } catch (error) {
      logger.error("[useLogout] Error logging out", error);
    }
  }, [privy]);

  return { logout };
};
