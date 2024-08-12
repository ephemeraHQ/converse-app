import { usePendingRequestsQuery } from "@queries/usePendingRequestsQuery";
import { PendingGroupJoinRequest } from "@utils/api";
import { useMemo } from "react";

import { useExistingGroupInviteLink } from "./useExistingGroupInviteLink";

export const useGroupPendingRequests = (topic: string) => {
  const { data } = usePendingRequestsQuery();
  const groupInviteLink = useExistingGroupInviteLink(topic);
  const requests = useMemo(() => {
    if (!data || !data.joinRequests) return [];
    const addressMap = new Map<string, PendingGroupJoinRequest>();
    for (const joinRequest of data.joinRequests) {
      if (groupInviteLink?.includes(joinRequest.groupInviteLinkId)) {
        addressMap.set(joinRequest.requesterAddress, joinRequest);
      }
    }
    return Array.from(addressMap);
  }, [data, groupInviteLink]);

  return requests;
};
