import { useQuery } from "@tanstack/react-query";
import { getGroupIdFromTopic, isGroupTopic } from "@utils/groupUtils/groupId";
import { Group } from "@xmtp/react-native-sdk";

import { groupQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
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
      return group;
    },
    enabled: !!data && !!client && isGroupTopic(topic),
    select: (data) => {
      if (!data) {
        return null;
      }
      if (data instanceof Group) {
        return data;
      }
      // Recreate the group object with the client
      return new Group(client!, data);
    },
  });
};

export const invalidateGroupQuery = (account: string, topic: string) => {
  queryClient.invalidateQueries({
    queryKey: groupQueryKey(account, topic),
  });
};
