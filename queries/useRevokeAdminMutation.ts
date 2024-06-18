import { useMutation } from "@tanstack/react-query";
import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { refreshGroup } from "../utils/xmtpRN/conversations";
import { revokeAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";

export const useRevokeAdminMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);

  return useMutation({
    mutationKey: revokeAdminMutationKey(account, topic),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.removeAdmin(inboxId);
      return inboxId;
    },
    onMutate: async (inboxId: InboxId) => {
      await cancelGroupMembersQuery(account, topic);

      const previousGroupMembers = getGroupMembersQueryData(account, topic);
      if (!previousGroupMembers) {
        return;
      }
      const newGroupMembers: Member[] = previousGroupMembers.map((member) => {
        if (member.inboxId === inboxId) {
          return {
            ...member,
            permissionLevel: "member",
          };
        }
        return member;
      });
      setGroupMembersQueryData(account, topic, newGroupMembers);

      return { previousGroupMembers };
    },
    onError: (_error, _variables, context) => {
      console.log("onError useRevokeAdminMutation");
      if (context?.previousGroupMembers === undefined) {
        return;
      }
      setGroupMembersQueryData(account, topic, context.previousGroupMembers);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess useRevokeAdminMutation");
      refreshGroup(account, topic);
    },
  });
};
