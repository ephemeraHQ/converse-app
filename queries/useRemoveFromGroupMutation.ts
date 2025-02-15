import { useMutation } from "@tanstack/react-query";
import { logger } from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { useGroupQuery } from "@queries/useGroupQuery";
import { removeMemberMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
// import { refreshGroup } from "../utils/xmtpRN/conversations";
import { captureError } from "@/utils/capture-error";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useRemoveFromGroupMutation = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: removeMemberMutationKey(account, topic!),
    mutationFn: async (inboxIds: InboxId[]) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.removeMembersByInboxId(inboxIds);
      return inboxIds;
    },
    onMutate: async (inboxIds: InboxId[]) => {
      if (!topic) {
        return;
      }
      await cancelGroupMembersQuery({ account, topic });
      const removeSet = new Set(inboxIds);

      const previousGroupMembers = getGroupMembersQueryData({
        account,
        topic,
      });
      if (!previousGroupMembers) {
        return;
      }

      const newGroupMembers = {
        ...previousGroupMembers,
        ids: previousGroupMembers.ids.filter(
          (member) => !removeSet.has(member)
        ),
      };
      setGroupMembersQueryData({
        account,
        topic,
        members: newGroupMembers,
      });

      return { previousGroupMembers };
    },
    onError: (error, _variables, context) => {
      captureError(error);
      if (context?.previousGroupMembers === undefined) {
        return;
      }
      if (!topic) {
        return;
      }
      setGroupMembersQueryData({
        account,
        topic,
        members: context.previousGroupMembers,
      });
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useRemoveFromGroupMutation");
      // refreshGroup(account, topic);
    },
  });
};
