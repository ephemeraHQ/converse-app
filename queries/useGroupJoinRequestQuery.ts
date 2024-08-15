import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { getGroupJoinRequest, GroupJoinRequest } from "@utils/api";

import { groupJoinRequestQueryKey } from "./QueryKeys";

export const useGroupJoinRequestQuery = (groupJoinRequestId?: string) => {
  const account = useCurrentAccount() as string;

  return useQuery<GroupJoinRequest | undefined>({
    queryKey: groupJoinRequestQueryKey(account, groupJoinRequestId ?? ""),
    queryFn: () => {
      if (!groupJoinRequestId) {
        return;
      }
      return getGroupJoinRequest(groupJoinRequestId);
    },
    enabled: !!groupJoinRequestId && !!account,
  });
};
