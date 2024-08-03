import { useMutation } from "@tanstack/react-query";
import logger from "@utils/logger";

import { setGroupNameMutationKey } from "./MutationKeys";
import {
  cancelGroupNameQuery,
  getGroupNameQueryData,
  setGroupNameQueryData,
} from "./useGroupNameQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useGroupNameMutation = (account: string, topic: string) => {
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
      setGroupNameQueryData(account, topic, groupName);
      return { previousGroupName };
    },
    // eslint-disable-next-line node/handle-callback-err
    onError: (_error, _variables, context) => {
      logger.warn("onError useGroupNameMutation");
      if (context?.previousGroupName === undefined) {
        return;
      }
      setGroupNameQueryData(account, topic, context.previousGroupName);
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useGroupNameMutation");
      refreshGroup(account, topic);
    },
  });
};
