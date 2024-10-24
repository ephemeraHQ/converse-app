import { useQuery } from "@tanstack/react-query";

import { groupMessagesQueryKey } from "./QueryKeys";
import { entify } from "./entify";
import { useGroupConversationScreenQuery } from "./useGroupQuery";
import { useRefreshOnFocus } from "./useRefreshOnFocus";

export const useGroupMessages = (account: string, topic: string) => {
  const { data: group } = useGroupConversationScreenQuery(account, topic);

  const queryData = useQuery({
    queryKey: groupMessagesQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return {
          ids: [],
          byId: {},
        };
      }
      const messages = await group.messages();
      return entify(messages, (message) => message.id);
    },
    enabled: !!group,
  });

  useRefreshOnFocus(queryData.refetch);

  return queryData;
};
