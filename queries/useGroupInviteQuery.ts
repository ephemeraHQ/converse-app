import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { getGroupInvite, GroupInvite } from "@utils/api";

import { groupInviteQueryKey } from "./QueryKeys";

export const useGroupInviteQuery = (groupInviteId: string) => {
  const account = useCurrentAccount() as string;

  return useQuery<GroupInvite | undefined>({
    // I need to learn more about how query keys work to determine
    // the significance of this query key with an account
    queryKey: groupInviteQueryKey(account, groupInviteId),
    // does this need to be in useQuery for any
    // other reason than convenient consumption via React?
    queryFn: () => getGroupInvite(groupInviteId),
    enabled: !!groupInviteId && !!account,
  });
};
