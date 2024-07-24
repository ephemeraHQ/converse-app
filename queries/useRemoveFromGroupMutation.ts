import { useMutation } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { removeMemberMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useRemoveFromGroupMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);

  return useMutation({
    mutationKey: removeMemberMutationKey(account, topic),
    mutationFn: async (inboxIds: InboxId[]) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.removeMembersByInboxId(inboxIds);
      return inboxIds;
    },
    onMutate: async (inboxIds: InboxId[]) => {
      await cancelGroupMembersQuery(account, topic);
      const removeSet = new Set(inboxIds);

      const previousGroupMembers = getGroupMembersQueryData(account, topic);
      if (!previousGroupMembers) {
        return;
      }
      const newGroupMembers = previousGroupMembers.filter(
        (member) => !removeSet.has(member.inboxId)
      );
      setGroupMembersQueryData(account, topic, newGroupMembers);

      return { previousGroupMembers };
    },
    onError: (_error, _variables, context) => {
      console.log("onError useRemoveFromGroupMutation");
      if (context?.previousGroupMembers === undefined) {
        return;
      }
      setGroupMembersQueryData(account, topic, context.previousGroupMembers);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess useRemoveFromGroupMutation");
      refreshGroup(account, topic);
    },
  });
};
