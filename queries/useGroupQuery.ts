import { useQuery } from "@tanstack/react-query";

import { groupQueryKey } from "./QueryKeys";
import { useGroupsQuery } from "./useGroupsQuery";

export const useGroupQuery = (account: string, topic: string) => {
  const { data } = useGroupsQuery(account);
  const group = data?.byId[topic] ?? null;
  console.log("group", !!group, topic, data?.ids);
  return useQuery({
    queryKey: groupQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      await group.sync();
      return group;
    },
    enabled: !!group,
  });
};
