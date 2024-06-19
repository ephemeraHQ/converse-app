import { useMutation } from "@tanstack/react-query";

import { refreshGroup } from "../utils/xmtpRN/conversations";
import { setGroupNameMutationKey } from "./MutationKeys";
import {
  cancelGroupNameQuery,
  getGroupNameQueryData,
  setGroupNameQueryData,
} from "./useGroupNameQuery";
import { useGroupQuery } from "./useGroupQuery";

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
      console.log("onError useGroupNameMutation");
      if (context?.previousGroupName === undefined) {
        return;
      }
      setGroupNameQueryData(account, topic, context.previousGroupName);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess useGroupNameMutation");
      refreshGroup(account, topic);
    },
  });
};
