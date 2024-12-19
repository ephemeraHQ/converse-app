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

export const useAddToGroupMutation = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery({ account, topic });

  return useMutation({
    mutationKey: addMemberMutationKey(account, topic!),
    mutationFn: async (addresses: string[]) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.addMembers(addresses);
      return addresses;
    },
    onMutate: async (_addresses: string[]) => {
      if (!topic) {
        return;
      }
      await cancelGroupMembersQuery(account, topic);
    },
    onError: (error, _variables, _context) => {
      captureError(error);
    },
    onSuccess: (_data, _variables, _context) => {
      logger.debug("onSuccess useAddToGroupMutation");
      if (!topic) {
        return;
      }
      invalidateGroupMembersQuery(account, topic);
      // refreshGroup(account, topic);
    },
  });
};
