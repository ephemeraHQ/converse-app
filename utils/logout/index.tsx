import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { usePrivy } from "@privy-io/expo";
import { StackActions } from "@react-navigation/native";
import { converseNavigatorRef } from "@utils/navigation";
import { useCallback } from "react";

export const useLogout = () => {
  const { setAuthStatus } = useAccountsStore();
  converseNavigatorRef.current?.dispatch(StackActions.popToTop());
  const privy = usePrivy();
  return useCallback(() => {
    if (privy.user) {
      privy.logout();
    }
    MultiInboxClient.instance.logoutMessagingClients();
    setAuthStatus(AuthStatuses.signedOut);
  }, [privy, setAuthStatus]);
};
