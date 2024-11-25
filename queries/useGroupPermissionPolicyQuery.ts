import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { groupPermissionPolicyQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupPermissionPolicyQuery = (
  account: string,
  topic: ConversationTopic | undefined
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupPermissionPolicyQueryKey(account, topic!),
    queryFn: () => {
      if (!group) {
        return;
      }
      return group.permissionPolicySet();
    },
    enabled: !!group && !!topic,
  });
};
