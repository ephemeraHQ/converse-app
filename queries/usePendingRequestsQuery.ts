import { useCurrentAccount } from "@features/accounts/accounts.store";
import { useQuery } from "@tanstack/react-query";
import { getPendingGroupJoinRequests } from "@utils/api";

import { pendingJoinRequestsQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

export const usePendingRequestsQuery = () => {
  const currentAccount = useCurrentAccount() as string;

  return useQuery({
    queryKey: pendingJoinRequestsQueryKey(currentAccount),
    queryFn: () => {
      return getPendingGroupJoinRequests(currentAccount);
    },
    enabled: !!currentAccount,
    // This just hits the backend api, we don't need to worry too much about information across the bridge
    staleTime: 1000,
  });
};

export const invalidatePendingJoinRequestsQuery = (account: string) => {
  return queryClient.invalidateQueries({
    queryKey: pendingJoinRequestsQueryKey(account),
  });
};
