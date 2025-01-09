import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { groupPermissionPolicyQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupPermissionPolicyQuery = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });
  return useQuery({
    queryKey: groupPermissionPolicyQueryKey({ inboxId, topic }),
    queryFn: () => {
      if (!group) {
        return;
      }
      return group.permissionPolicySet();
    },
    enabled: !!group && !!topic,
  });
};
