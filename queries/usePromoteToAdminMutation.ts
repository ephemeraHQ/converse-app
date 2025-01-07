import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { promoteAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { captureError } from "@/utils/capture-error";

export const usePromoteToAdminMutation = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useMutation({
    mutationKey: promoteAdminMutationKey({ inboxId, topic }),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !inboxId || !topic) {
        return;
      }
      await group.addAdmin(inboxId);
      return inboxId;
    },
    onMutate: async (inboxId: InboxId) => {
      if (!topic) {
        return;
      }
      await cancelGroupMembersQuery({ inboxId, topic });

      const previousGroupMembers = getGroupMembersQueryData({
        inboxId,
        topic,
      });
      if (!previousGroupMembers) {
        return;
      }
      const newMembers = { ...previousGroupMembers };
      if (!newMembers.byId[inboxId]) {
        return;
      }
      newMembers.byId[inboxId].permissionLevel = "admin";
      setGroupMembersQueryData({ inboxId, topic }, newMembers);

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
    // For now we need to make sure the group is updated for handling on the conversation screen
    onSuccess: () => {
      logger.debug("onSuccess usePromoteToAdminMutation");
    },
  });
};
