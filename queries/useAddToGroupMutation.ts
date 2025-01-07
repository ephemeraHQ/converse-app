import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";

import { captureError } from "@/utils/capture-error";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { addMemberMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  invalidateGroupMembersQuery,
} from "./useGroupMembersQuery";
// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useAddToGroupMutation = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useMutation({
    mutationKey: addMemberMutationKey(args),
    mutationFn: async (addresses: string[]) => {
      if (!group || !inboxId || !topic) {
        return;
      }
      await group.addMembers(addresses);
      return addresses;
    },
    onMutate: async (_addresses: string[]) => {
      if (!topic) {
        return;
      }
      await cancelGroupMembersQuery({ inboxId, topic });
    },
    onError: (error, _variables, _context) => {
      captureError(error);
    },
    onSuccess: (_data, _variables, _context) => {
      logger.debug("onSuccess useAddToGroupMutation");
      if (!topic) {
        return;
      }
      invalidateGroupMembersQuery({ inboxId, topic });
      // refreshGroup(account, topic);
    },
  });
};
