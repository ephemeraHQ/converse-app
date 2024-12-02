import { queryClient } from "@/queries/queryClient";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client";
import { useGroupQuery } from "@queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { groupPermissionsQueryKey } from "./QueryKeys";

type IGetGroupPermissionPolicySet = Awaited<
  ReturnType<typeof getGroupPermissionPolicySet>
>;

function getGroupPermissionPolicySet(args: { group: GroupWithCodecsType }) {
  const { group } = args;
  return group?.permissionPolicySet();
}

export const useGroupPermissionsQuery = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery(getGroupPermissionsQueryOptions({ account, topic, group }));
};

export function getGroupPermissionsQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
  group: GroupWithCodecsType | undefined | null;
}) {
  const { account, topic, group } = args;
  return {
    enabled: !!group,
    queryFn: () =>
      getGroupPermissionPolicySet({
        group: group!,
      }),
    queryKey: groupPermissionsQueryKey(account, topic),
  };
}

export function getGroupPermissionLevel(args: {
  account: string;
  topic: ConversationTopic;
  group: GroupWithCodecsType | undefined | null;
}) {
  const { account, topic, group } = args;
  return queryClient.getQueryData<IGetGroupPermissionPolicySet>(
    getGroupPermissionsQueryOptions({ account, topic, group }).queryKey
  );
}
