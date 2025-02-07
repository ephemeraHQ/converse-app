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

export const useLogout = () => {
  const { setAuthStatus } = useAccountsStore();
  const privy = usePrivy();

  const logout = useCallback(async () => {
    converseNavigatorRef.current?.dispatch(StackActions.popToTop());
    MultiInboxClient.instance.logoutMessagingClients();
    await privy.logout();

    queryClient.removeQueries({
      queryKey: ["embeddedWallet"],
    });

    setAuthStatus(AuthStatuses.signedOut);
  }, [privy, setAuthStatus]);

  return { logout };
};
