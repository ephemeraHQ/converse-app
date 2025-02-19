import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { queryClient } from "@/queries/queryClient";
import { usePrivy } from "@privy-io/expo";
import { StackActions } from "@react-navigation/native";
import { converseNavigatorRef } from "@utils/navigation";
import { useCallback } from "react";
import { logger } from "../../utils/logger";
import { clearJwtQueryData } from "./jwt.query";

export const useLogout = () => {
  const { setAuthStatus } = useAccountsStore();
  const privy = usePrivy();

  const logout = useCallback(async () => {
    setAuthStatus(AuthStatuses.signedOut);
    logger.debug("[useLogout] Logging out invoked");
    try {
      await privy.logout();
      logger.debug(
        "[useLogout] Privy logout await completed, checking client user call"
      );

      converseNavigatorRef.current?.dispatch(StackActions.popToTop());
      MultiInboxClient.instance.logoutMessagingClients();

      queryClient.removeQueries({
        queryKey: ["embeddedWallet"],
      });
      queryClient.removeQueries({
        queryKey: ["current-user"],
      });
      clearJwtQueryData();
    } catch (error) {
      logger.error("[useLogout] Error logging out", error);
    }
  }, [privy, setAuthStatus]);

  return { logout };
};
