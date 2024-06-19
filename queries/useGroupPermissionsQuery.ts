import { useQuery } from "@tanstack/react-query";

import { groupPermissionsQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupPermissionsQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupPermissionsQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      // Adding as a query for now as I imagine group permissions will be more complex
      // in the future
      return group.permissionLevel;
    },
    enabled: !!group,
  });
};
