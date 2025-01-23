import { useGroupPendingRequestsQuery } from "@/queries/useGroupPendingRequestsQuery";
import { PendingGroupJoinRequest } from "@/utils/api/api-groups/api-groups";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { useExistingGroupInviteLink } from "./useExistingGroupInviteLink";
import { useGroupMembers } from "./useGroupMembers";

export const useGroupPendingRequests = (topic: ConversationTopic) => {
  const { data } = useGroupPendingRequestsQuery();
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
