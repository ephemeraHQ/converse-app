import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { promoteSuperAdminMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const usePromoteToSuperAdminMutation = (
  account: string,
  topic: string
) => {
  const { data: group } = useGroupQuery(account, topic);

  return useMutation({
    mutationKey: promoteSuperAdminMutationKey(account, topic),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.addSuperAdmin(inboxId);
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
            permissionLevel: "super_admin",
          };
        }
        return member;
      });
      setGroupMembersQueryData(account, topic, newGroupMembers);

      return { previousGroupMembers };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError usePromoteToSuperAdminMutation");
      sentryTrackError(error);
      if (context?.previousGroupMembers === undefined) {
        return;
      }
      setGroupMembersQueryData(account, topic, context.previousGroupMembers);
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess usePromoteToSuperAdminMutation");
      refreshGroup(account, topic);
    },
  });
};
