import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useGroupQuery } from "@queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { groupPermissionsQueryKey } from "./QueryKeys";

function getGroupPermissionPolicySet(args: { group: GroupWithCodecsType }) {
  const { group } = args;
  return group?.permissionPolicySet();
}

export const useGroupPermissionsQuery = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });
  return useQuery(getGroupPermissionsQueryOptions({ inboxId, topic, group }));
};

function getGroupPermissionsQueryOptions(args: {
  inboxId: InboxId;
  topic: ConversationTopic;
  group: GroupWithCodecsType | undefined | null;
}) {
  const { inboxId, topic, group } = args;
  return {
    enabled: !!group,
    queryFn: () =>
      getGroupPermissionPolicySet({
        group: group!,
      }),
    queryKey: groupPermissionsQueryKey({ inboxId, topic }),
  };
}
