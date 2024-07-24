import { useMutation } from "@tanstack/react-query";

import { addMemberMutationKey } from "./MutationKeys";
import {
  cancelGroupMembersQuery,
  invalidateGroupMembersQuery,
} from "./useGroupMembersQuery";
import { useGroupQuery } from "./useGroupQuery";
import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useAddToGroupMutation = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);

  return useMutation({
    mutationKey: addMemberMutationKey(account, topic),
    mutationFn: async (addresses: string[]) => {
      if (!group || !account || !topic) {
        return;
      }
      await group.addMembers(addresses);
      return addresses;
    },
    onMutate: async (_addresses: string[]) => {
      await cancelGroupMembersQuery(account, topic);
    },
    onError: (_error, _variables, _context) => {
      console.log("onError useAddToGroupMutation");
    },
    onSuccess: (_data, _variables, _context) => {
      console.log("onSuccess useAddToGroupMutation");
      invalidateGroupMembersQuery(account, topic);
      refreshGroup(account, topic);
    },
  });
};
