import { useCurrentAccount } from "@features/accounts/accounts.store";
import { useQuery } from "@tanstack/react-query";
import { getGroupInvite, GroupInvite } from "@utils/api";

import { groupInviteQueryKey } from "./QueryKeys";

export const useGroupInviteQuery = (groupInviteId: string) => {
  const account = useCurrentAccount() as string;

  return useQuery<GroupInvite | undefined>({
    queryKey: groupInviteQueryKey(account, groupInviteId),
    queryFn: () => getGroupInvite(groupInviteId),
    enabled: !!groupInviteId && !!account,
  });
};
