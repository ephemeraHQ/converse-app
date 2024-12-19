import { captureError } from "@/utils/capture-error";
import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";
import { promoteSuperAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";
// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const usePromoteToSuperAdminMutation = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: promoteSuperAdminMutationKey(account, topic!),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.addSuperAdmin(inboxId);
      return inboxId;
    },
    onMutate: async (inboxId: InboxId) => {
      if (!topic) {
        throw new Error("Topic is required");
      }
      await cancelGroupMembersQuery(account, topic);

      const previousGroupMembers = getGroupMembersQueryData(account, topic);
      if (!previousGroupMembers) {
        return;
      }
      const newMembers = { ...previousGroupMembers };
      if (!newMembers.byId[inboxId]) {
        return;
      }
      newMembers.byId[inboxId].permissionLevel = "super_admin";
      setGroupMembersQueryData(account, topic, newMembers);

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
      setGroupMembersQueryData(account, topic, context.previousGroupMembers);
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess usePromoteToSuperAdminMutation");
      // refreshGroup(account, topic);
    },
  });
};
