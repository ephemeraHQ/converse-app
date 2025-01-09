import { useQuery } from "@tanstack/react-query";
import { getPendingGroupJoinRequests } from "@utils/api";

import { pendingJoinRequestsQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { InboxId } from "@xmtp/react-native-sdk";

export const usePendingRequestsQuery = ({ inboxId }: { inboxId: InboxId }) => {
  return useQuery({
    queryKey: pendingJoinRequestsQueryKey({ inboxId }),
    queryFn: () => {
      return getPendingGroupJoinRequests({ inboxId });
    },
    enabled: !!inboxId,
    // This just hits the backend api, we don't need to worry too much about information across the bridge
    staleTime: 1000,
  });
};

export const invalidatePendingJoinRequestsQuery = ({
  inboxId,
}: {
  inboxId: InboxId;
}) => {
  return queryClient.invalidateQueries({
    queryKey: pendingJoinRequestsQueryKey({ inboxId }),
  });
};
