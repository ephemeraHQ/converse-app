import {
  queryOptions as reactQueryOptions,
  SetDataOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/getCleanAddress";
import { ConversationTopic, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";
import { entifyWithAddress, EntityObjectWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { groupMembersQueryKey } from "./QueryKeys";
import { getOrFetchGroupQuery } from "./useGroupQuery";

export type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

const fetchGroupMembers = async (args: {
  account: string;
  topic: ConversationTopic;
}): Promise<EntityObjectWithAddress<Member, InboxId>> => {
  const { account, topic } = args;
  const group = await getOrFetchGroupQuery({
    account,
    topic,
    caller: "fetchGroupMembers",
  });

  if (!group) {
    throw new Error(`Group ${topic} not found in query data cache`);
  }

  const members = await group.members();

  return entifyWithAddress(
    members,
    (member) => member.inboxId,
    (member) => getCleanAddress(member.addresses[0])
  );
};

const getGroupMemberQueryOptions = (args: {
  account: string;
  topic: ConversationTopic;
  queryOptions?: Partial<UseQueryOptions<GroupMembersSelectData>>;
}): UseQueryOptions<GroupMembersSelectData> => {
  const { account, topic, queryOptions } = args;
  const isEnabled = !!topic && (queryOptions?.enabled ?? true);
  return reactQueryOptions({
    queryKey: groupMembersQueryKey(account, topic),
    queryFn: () => fetchGroupMembers({ account, topic }),
    enabled: isEnabled,
    ...queryOptions,
  });
};

export const useGroupMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return useQuery<GroupMembersSelectData>(
    getGroupMemberQueryOptions({ account, topic })
  );
};

export const getGroupMembersQueryData = (
  account: string,
  topic: ConversationTopic
): GroupMembersSelectData | undefined =>
  queryClient.getQueryData(
    getGroupMemberQueryOptions({ account, topic }).queryKey
  );

export const setGroupMembersQueryData = (
  account: string,
  topic: ConversationTopic,
  members: GroupMembersSelectData,
  options?: SetDataOptions
) => {
  queryClient.setQueryData<GroupMembersSelectData>(
    getGroupMemberQueryOptions({ account, topic }).queryKey,
    members,
    options
  );
};

export const cancelGroupMembersQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.cancelQueries({
    queryKey: getGroupMemberQueryOptions({ account, topic }).queryKey,
  });
};

export const invalidateGroupMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return queryClient.invalidateQueries({
    queryKey: getGroupMemberQueryOptions({ account, topic }).queryKey,
  });
};

export function refetchGroupMembersQuery(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryClient.refetchQueries({
    queryKey: getGroupMemberQueryOptions({ account, topic }).queryKey,
  });
}

export async function ensureGroupMembersQueryData(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryClient.ensureQueryData({
    queryKey: getGroupMemberQueryOptions({
      account,
      topic,
    }).queryKey,
  });
}
