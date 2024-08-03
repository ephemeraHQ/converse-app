import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";

import { setGroupDescriptionMutationKey } from "./MutationKeys";
import {
  cancelGroupDescriptionQuery,
  getGroupDescriptionQueryData,
  setGroupDescriptionQueryData,
} from "./useGroupDescriptionQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useGroupDescriptionMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useMutation({
    mutationKey: setGroupDescriptionMutationKey(account, topic),
    mutationFn: async (groupDescription: string) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.updateGroupDescription(groupDescription);
      return groupDescription;
    },
    onMutate: async (groupDescription: string) => {
      await cancelGroupDescriptionQuery(account, topic);
      const previousGroupDescription = getGroupDescriptionQueryData(
        account,
        topic
      );
      setGroupDescriptionQueryData(account, topic, groupDescription);
      return { previousGroupDescription };
    },
    // eslint-disable-next-line node/handle-callback-err
    onError: (_error, _variables, context) => {
      logger.warn("onError useGroupDescriptionMutation");
      if (context?.previousGroupDescription === undefined) {
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
      refreshGroup(account, topic);
    },
  });
};
