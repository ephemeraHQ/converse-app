import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";

import { setGroupDescriptionMutationKey } from "./MutationKeys";
import {
  cancelGroupDescriptionQuery,
  getGroupDescriptionQueryData,
  setGroupDescriptionQueryData,
} from "./useGroupDescriptionQuery";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useGroupDescriptionMutation = (
  account: string,
  topic: ConversationTopic | undefined
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useMutation({
    mutationKey: setGroupDescriptionMutationKey(account, topic!),
    mutationFn: async (groupDescription: string) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.updateGroupDescription(groupDescription);
      return groupDescription;
    },
    onMutate: async (groupDescription: string) => {
      if (!topic) {
        return;
      }
      await cancelGroupDescriptionQuery(account, topic);
      const previousGroupDescription = getGroupDescriptionQueryData(
        account,
        topic
      );
      setGroupDescriptionQueryData(account, topic, groupDescription);
      return { previousGroupDescription };
    },
    onError: (error, _variables, context) => {
      logger.warn("onError useGroupDescriptionMutation");
      sentryTrackError(error);
      if (context?.previousGroupDescription === undefined) {
        return;
      }
      if (!topic) {
        return;
      }
      setGroupDescriptionQueryData(
        account,
        topic,
        context.previousGroupDescription
      );
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useGroupDescriptionMutation");
      // refreshGroup(account, topic);
    },
  });
};
