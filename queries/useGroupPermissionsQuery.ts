import { getGroupQueryData } from "@queries/useGroupQuery";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { groupPermissionsQueryKey } from "./QueryKeys";

// type IGetGroupPermissionPolicySet = Awaited<
//   ReturnType<typeof getGroupPermissionPolicySet>
// >;

function getGroupPermissionPolicySet(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  const group = getGroupQueryData({ account, topic });
  return group?.permissionPolicySet();
}

export const useGroupPermissionsQuery = (
  account: string,
  topic: ConversationTopic
) => {
  return useQuery(getGroupPermissionsQueryOptions({ account, topic }));
};

function getGroupPermissionsQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryOptions({
    queryFn: () =>
      getGroupPermissionPolicySet({
        account,
        topic,
      }),
    queryKey: groupPermissionsQueryKey(account, topic),
    enabled: !!topic && !!account,
  });
}
