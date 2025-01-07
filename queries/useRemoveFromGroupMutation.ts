import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { removeMemberMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { captureError } from "@/utils/capture-error";

export const useRemoveFromGroupMutation = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useMutation({
    mutationKey: removeMemberMutationKey(args),
    mutationFn: async (inboxIds: InboxId[]) => {
      if (!group || !inboxId || !topic) {
        return;
      }
      await group.removeMembersByInboxId(inboxIds);
      return inboxIds;
    },
    onMutate: async (inboxIds: InboxId[]) => {
      if (!topic) {
        return;
      }
      await cancelGroupMembersQuery({ inboxId, topic });
      const removeSet = new Set(inboxIds);

      const previousGroupMembers = getGroupMembersQueryData({
        inboxId,
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
      setGroupMembersQueryData({ inboxId, topic }, newGroupMembers);

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
      setGroupMembersQueryData(
        { inboxId, topic },
        context.previousGroupMembers
      );
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useRemoveFromGroupMutation");
      // refreshGroup(account, topic);
    },
  });
};
