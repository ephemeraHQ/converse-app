import { usePendingRequestsQuery } from "@queries/usePendingRequestsQuery";
import { PendingGroupJoinRequest } from "@utils/api";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { useExistingGroupInviteLink } from "./useExistingGroupInviteLink";
import { useGroupMembers } from "./useGroupMembers";

export const useGroupPendingRequests = (topic: ConversationTopic) => {
  const { data } = usePendingRequestsQuery();
  const { members } = useGroupMembers(topic);

  const groupInviteLink = useExistingGroupInviteLink(topic);

  const requests = useMemo(() => {
    if (!data || !data.joinRequests) return [];
    const addressMap = new Map<string, PendingGroupJoinRequest>();
    for (const joinRequest of data.joinRequests) {
      if (
        groupInviteLink?.includes(joinRequest.groupInviteLinkId) &&
        !members?.byAddress[joinRequest.requesterAddress]
      ) {
        addressMap.set(joinRequest.requesterAddress, joinRequest);
      }
    }
    return Array.from(addressMap);
  }, [data, groupInviteLink, members]);

  return requests;
};
