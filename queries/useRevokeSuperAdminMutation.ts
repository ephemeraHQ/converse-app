import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { revokeSuperAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useRevokeSuperAdminMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);

  return useMutation({
    mutationKey: revokeSuperAdminMutationKey(account, topic),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.removeSuperAdmin(inboxId);
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
            permissionLevel: "admin",
          };
        }
        return member;
      });
      setGroupMembersQueryData(account, topic, newGroupMembers);

      return { previousGroupMembers };
    },
    onError: (_error, _variables, context) => {
      logger.warn("onError useRevokeSuperAdminMutation");
      if (context?.previousGroupMembers === undefined) {
        return;
      }
      setGroupMembersQueryData(account, topic, context.previousGroupMembers);
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useRevokeSuperAdminMutation");
      refreshGroup(account, topic);
    },
  });
};
