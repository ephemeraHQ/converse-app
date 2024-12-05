import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";

import { setGroupNameMutationKey } from "./MutationKeys";
import {
  cancelGroupNameQuery,
  getGroupNameQueryData,
} from "./useGroupNameQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { handleGroupNameUpdate } from "@/utils/groupUtils/handleGroupNameUpdate";

export const useGroupNameMutation = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useMutation({
    mutationKey: setGroupNameMutationKey(account, topic),
    mutationFn: async (groupName: string) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.updateGroupName(groupName);
      return groupName;
    },
    onMutate: async (groupName: string) => {
      await cancelGroupNameQuery(account, topic);
      const previousGroupName = getGroupNameQueryData(account, topic);
      handleGroupNameUpdate({ account, topic, name: groupName });
      return { previousGroupName };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useGroupNameMutation");
      sentryTrackError(error);
      if (context?.previousGroupName === undefined) {
        return;
      }
      handleGroupNameUpdate({
        account,
        topic,
        name: context.previousGroupName,
      });
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useGroupNameMutation");
      // refreshGroup(account, topic);
    },
  });
};
