import { useQuery } from "@tanstack/react-query";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";

import { groupQueryKey } from "./QueryKeys";
import { useClient } from "./useClient";

export const useGroupQuery = (account: string, topic: string) => {
  const client = useClient(account);
  return useQuery({
    queryKey: groupQueryKey(account, topic),
    queryFn: async () => {
      const group = await client?.conversations.findGroup(
        getGroupIdFromTopic(topic)
      );
      if (!group) {
        return;
      }
      await group.sync();
      return group;
    },
    enabled: !!client,
  });
};
