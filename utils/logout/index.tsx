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
  converseNavigatorRef.current?.dispatch(StackActions.popToTop());
  const privy = usePrivy();
  return useCallback(() => {
    queryClient.removeQueries({
      queryKey: ["embeddedWallet"],
    });
    if (privy.user) {
      privy.logout();
    }
    MultiInboxClient.instance.logoutMessagingClients();
    setAuthStatus(AuthStatuses.signedOut);
  }, [privy, setAuthStatus]);
};
