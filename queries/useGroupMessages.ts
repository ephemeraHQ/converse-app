import { useQuery } from "@tanstack/react-query";

import { groupMessagesQueryKey } from "./QueryKeys";
import { entify } from "./entify";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupMessages = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupMessagesQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      const messages = await group.messages();
      return messages;
    },
    enabled: !!group,
    select: (data) => {
      if (!data)
        return {
          byId: {},
          ids: [],
        };
      return entify(data, (message) => message.id);
    },
  });
};
