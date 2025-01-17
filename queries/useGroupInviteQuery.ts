import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { getGroupInvite } from "@/utils/api/api-groups/api-groups";
import { GroupInvite } from "@/utils/api/api-groups/api-group.types";

import { groupInviteQueryKey } from "./QueryKeys";

export const useGroupInviteQuery = (groupInviteId: string) => {
  const account = useCurrentAccount() as string;

  return useQuery<GroupInvite | undefined>({
    queryKey: groupInviteQueryKey(account, groupInviteId),
    queryFn: () => getGroupInvite(groupInviteId),
    enabled: !!groupInviteId && !!account,
  });
};
