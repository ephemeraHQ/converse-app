import { useQuery } from "@tanstack/react-query";

import { groupPermissionsQueryKey } from "./QueryKeys";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
export const useGroupPermissionsQuery = (
  account: string,
  topic: ConversationTopic | undefined
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupPermissionsQueryKey(account, topic!),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.permissionPolicySet();
    },
    enabled: !!group,
  });
};
