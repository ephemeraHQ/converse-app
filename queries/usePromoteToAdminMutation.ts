import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { promoteAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
// import { refreshGroup } from "../utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { captureError } from "@/utils/capture-error";

export const usePromoteToAdminMutation = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: promoteAdminMutationKey(account, topic!),
    // The actual function that will be called to promote a member to admin
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.addAdmin(inboxId);
      return inboxId;
    },
    // Nice to have functionality, but not necessary for the task
    // onMutation will happen before the mutation is executed
    // So this is where we can optimistically update the cache
    onMutate: async (inboxId: InboxId) => {
      if (!topic) {
        return;
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
      newMembers.byId[inboxId].permissionLevel = "admin";
      setGroupMembersQueryData(account, topic, newMembers);

      return { previousGroupMembers };
    },
    // Use onError to revert the cache if the mutation fails
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
    // For now we need to make sure the group is updated for handling on the conversation screen
    onSuccess: () => {
      logger.debug("onSuccess usePromoteToAdminMutation");
      // refreshGroup(account, topic);
    },
  });
};
