import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { revokeSuperAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { captureError } from "@/utils/capture-error";
// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useRevokeSuperAdminMutation = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useMutation({
    mutationKey: revokeSuperAdminMutationKey(args),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !inboxId || !topic) {
        return;
      }
      await group.removeSuperAdmin(inboxId);
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
      newMembers.byId[inboxId].permissionLevel = "member";
      setGroupMembersQueryData({ inboxId, topic }, newMembers);

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
      setGroupMembersQueryData(
        { inboxId, topic },
        context.previousGroupMembers
      );
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useRevokeSuperAdminMutation");
      // refreshGroup(account, topic);
    },
  });
};
