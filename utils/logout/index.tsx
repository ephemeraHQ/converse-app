import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { queryClient } from "@/queries/queryClient";
import { usePrivy, usePrivyClient } from "@privy-io/expo";
import { StackActions } from "@react-navigation/native";
import { converseNavigatorRef } from "@utils/navigation";
import { useCallback } from "react";
import logger from "../logger";

export const useLogout = () => {
  const { setAuthStatus } = useAccountsStore();
  const privy = usePrivy();
  const privyClient = usePrivyClient();

  const logout = useCallback(async () => {
    setAuthStatus(AuthStatuses.signedOut);
    logger.debug("[useLogout] Logging out invoked");
    try {
      await privy.logout();
      logger.debug(
        "[useLogout] Privy logout await completed, checking client user call"
      );
      // let accessToken;
      // try {
      //   accessToken = await privyClient.getAccessToken();
      //   logger.debug("[useLogout] Privy access token", accessToken);
      // } catch (error) {
      //   logger.error("[useLogout] Error getting access token", error);
      // }

      // let identityToken;
      // try {
      //   identityToken = await privyClient.getIdentityToken();
      //   logger.debug("[useLogout] Privy identity token", identityToken);
      // } catch (error) {
      //   logger.error("[useLogout] Error getting identity token", error);
      // }

      // let user;
      // try {
      //   user = await privyClient.user.get();
      //   logger.debug("[useLogout] Privy user", user);
      // } catch (error) {
      //   logger.error("[useLogout] Error getting user", error);
      // }
      // const isUSerThere = !!user;
      // if (isUSerThere) {
      //   logger.debug("[useLogout] User is there, logging out");
      //   throw new Error("User is there after calling logout");
      // } else {
      //   logger.debug("[useLogout] User is not there, continuing logout");
      // }

      converseNavigatorRef.current?.dispatch(StackActions.popToTop());
      MultiInboxClient.instance.logoutMessagingClients();

      queryClient.removeQueries({
        queryKey: ["embeddedWallet"],
      });
    } catch (error) {
      logger.error("[useLogout] Error logging out", error);
    }
  }, [privy, setAuthStatus, privyClient]);

  return { logout };
};
