import { useMutation } from "@tanstack/react-query";
import { logger } from "@utils/logger";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { captureError } from "@/utils/capture-error";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { revokeSuperAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useRevokeSuperAdminMutation = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: revokeSuperAdminMutationKey(account, topic!),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.removeSuperAdmin(inboxId);
      return inboxId;
    },
    onMutate: async (inboxId: InboxId) => {
      if (!topic) {
        return;
      }
      await cancelGroupMembersQuery({ account, topic });

      const previousGroupMembers = getGroupMembersQueryData({
        account,
        topic,
      });
      if (!previousGroupMembers) {
        return;
      }
      const newMembers = { ...previousGroupMembers };
      if (!newMembers.byId[inboxId]) {
        return;
      }
      newMembers.byId[inboxId].permissionLevel = "member";
      setGroupMembersQueryData({
        account,
        topic,
        members: newMembers,
      });

      return { previousGroupMembers };
    },
    onError: (error, _variables, context) => {
      captureError(error);
      if (!topic) {
        return;
      }
      if (context?.previousGroupMembers === undefined) {
        return;
      }
      setGroupMembersQueryData({
        account,
        topic,
        members: context.previousGroupMembers,
      });
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useRevokeSuperAdminMutation");
      // refreshGroup(account, topic);
    },
  });
};
