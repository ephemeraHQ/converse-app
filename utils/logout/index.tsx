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

// todo what queries should be removed?
export const useLogout = () => {
  const { setAuthStatus } = useAccountsStore();
  const privy = usePrivy();

  const logout = useCallback(async () => {
    if (privy.user) {
      await privy.logout();
    }
    converseNavigatorRef.current?.dispatch(StackActions.popToTop());

    queryClient.removeQueries({
      queryKey: ["embeddedWallet"],
    });

    MultiInboxClient.instance.logoutMessagingClients();
    setAuthStatus(AuthStatuses.signedOut);
  }, [privy, setAuthStatus]);

  return { logout };
};
