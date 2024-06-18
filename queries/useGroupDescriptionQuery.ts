import { useQuery } from "@tanstack/react-query";

import { groupDescriptionQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupDescriptionQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupDescriptionQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return "";
      // return group.groupDescription();
    },
    enabled: !!group,
  });
};
