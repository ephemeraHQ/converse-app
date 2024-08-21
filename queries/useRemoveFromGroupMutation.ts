import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { removeMemberMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useRemoveFromGroupMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);

  return useMutation({
    mutationKey: removeMemberMutationKey(account, topic),
    mutationFn: async (inboxIds: InboxId[]) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.removeMembersByInboxId(inboxIds);
      return inboxIds;
    },
    onMutate: async (inboxIds: InboxId[]) => {
      await cancelGroupMembersQuery(account, topic);
      const removeSet = new Set(inboxIds);

      const previousGroupMembers = getGroupMembersQueryData(account, topic);
      if (!previousGroupMembers) {
        return;
      }

      const newGroupMembers = {
        ...previousGroupMembers,
        ids: previousGroupMembers.ids.filter(
          (member) => !removeSet.has(member)
        ),
      };
      setGroupMembersQueryData(account, topic, newGroupMembers);

      return { previousGroupMembers };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useRemoveFromGroupMutation");
      sentryTrackError(error);
      if (context?.previousGroupMembers === undefined) {
        return;
      }
      setGroupMembersQueryData(account, topic, context.previousGroupMembers);
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useRemoveFromGroupMutation");
      refreshGroup(account, topic);
    },
  });
};
