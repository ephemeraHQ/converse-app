import { usePrivy } from "@privy-io/expo";
import { useCallback } from "react";
import { useAuthStore } from "@/features/authentication/authentication.store";
import { resetAccountStore } from "@/features/authentication/multi-inbox.store";
import { queryClient } from "@/queries/queryClient";
import { captureError } from "@/utils/capture-error";
import { GenericError } from "@/utils/error";
import { reactQueryMMKV, secureQueryMMKV } from "@/utils/mmkv";
import { logger } from "../../utils/logger";

export const useLogout = () => {
  const { logout: privyLogout } = usePrivy();

  const logout = useCallback(async () => {
    logger.debug("Logging out...");

    try {
      useAuthStore.getState().actions.setStatus("signedOut");

      await privyLogout();

      resetAccountStore();

      // Clear both in-memory cache and persisted data
      queryClient.getQueryCache().clear();
      queryClient.clear();
      queryClient.removeQueries();
      reactQueryMMKV.clearAll();
      secureQueryMMKV.clearAll();

      logger.debug("Successfully logged out");
    } catch (error) {
      captureError(
        new GenericError({
          error,
          additionalMessage: "Error logging out",
        }),
      );
    }
  }, [privyLogout]);

  return { logout };
};
