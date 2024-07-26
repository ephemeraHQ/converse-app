import { useQuery } from "@tanstack/react-query";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";

import { groupQueryKey } from "./QueryKeys";
import { useClient } from "./useClient";
import { useGroupsQuery } from "./useGroupsQuery";

export const useGroupQuery = (account: string, topic: string) => {
  const client = useClient(account);
  const { data } = useGroupsQuery(account);
  return useQuery({
    queryKey: groupQueryKey(account, topic),
    queryFn: async () => {
      if (!topic) {
        return null;
      }
      let group = data?.byId[topic];
      if (!group) {
        group = await client?.conversations.findGroup(
          getGroupIdFromTopic(topic)
        );
        if (!group) {
          return null;
        }
      }
      await group.sync();
      return group;
    },
    enabled: !!data && !!client,
  });
};
