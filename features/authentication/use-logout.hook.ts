import { useAuthStore } from "@/features/authentication/authentication.store";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { clearAllStores } from "@/features/multi-inbox/multi-inbox.store";
import { queryClient } from "@/queries/queryClient";
import { reactQueryMMKV, secureQueryMMKV } from "@/utils/mmkv";
import { usePrivy } from "@privy-io/expo";
import { useCallback } from "react";
import { logger } from "../../utils/logger";

export const useLogout = () => {
  const privy = usePrivy();

  const logout = useCallback(async () => {
    logger.debug("[useLogout] Logging out invoked");
    try {
      useAuthStore.getState().actions.setStatus("signedOut");

      await privy.logout();

      logger.debug(
        "[useLogout] Privy logout await completed, checking client user call"
      );

      clearAllStores();

      // converseNavigatorRef.current?.dispatch(StackActions.popToTop());

      MultiInboxClient.instance.logoutMessagingClients();

      // Clear both in-memory cache and persisted data
      queryClient.getQueryCache().clear();
      queryClient.clear();
      queryClient.removeQueries();
      reactQueryMMKV.clearAll();
      secureQueryMMKV.clearAll();
    } catch (error) {
      logger.error("[useLogout] Error logging out", error);
    }
  }, [privy]);

  return { logout };
};
