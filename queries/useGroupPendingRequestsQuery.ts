import { getPendingGroupJoinRequests } from "@/utils/api/api-groups/api-groups";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useQuery } from "@tanstack/react-query";

import { pendingJoinRequestsQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

export const useGroupPendingRequestsQuery = () => {
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

export const invalidateGroupPendingJoinRequestsQuery = (account: string) => {
  return queryClient.invalidateQueries({
    queryKey: pendingJoinRequestsQueryKey(account),
  });
};
