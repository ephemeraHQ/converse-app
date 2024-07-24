import { useQuery } from "@tanstack/react-query";

import { groupFirstMessageQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupFirstMessageQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupFirstMessageQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      const messages = await group.messages({ limit: 1 });
      return messages[0];
    },
    enabled: !!group,
  });
};
