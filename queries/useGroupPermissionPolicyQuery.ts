import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { groupPermissionPolicyQueryKey } from "./QueryKeys";
import { getGroupQueryData } from "./useGroupQuery";

export const useGroupPermissionPolicyQuery = (
  account: string,
  topic: ConversationTopic,
) => {
  return useQuery({
    queryKey: groupPermissionPolicyQueryKey(account, topic!),
    queryFn: () => {
      const group = getGroupQueryData({ account, topic });
      if (!group) {
        return;
      }

      return group.permissionPolicySet();
    },
    enabled: !!topic,
  });
};
