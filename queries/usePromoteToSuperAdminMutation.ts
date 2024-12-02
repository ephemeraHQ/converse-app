import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { promoteSuperAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const usePromoteToSuperAdminMutation = (
  account: string,
  topic: ConversationTopic | undefined
) => {
  const { data: group } = useGroupQuery(account, topic);

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
      logger.warn("onError usePromoteToSuperAdminMutation");
      sentryTrackError(error);
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
