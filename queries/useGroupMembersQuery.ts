import { queryOptions, SetDataOptions, useQuery } from "@tanstack/react-query";
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

type IGroupMembersQueryConfigArgs = {
  account: string;
  topic: ConversationTopic;
};

export const getGroupMemberQueryOptions = (
  args: IGroupMembersQueryConfigArgs
) => {
  const { account, topic } = args;
  return queryOptions({
    queryKey: groupMembersQueryKey(account, topic),
    queryFn: () => fetchGroupMembers({ account, topic }),
    enabled: !!topic && !!account,
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
  queryClient.getQueryData(groupMembersQueryKey(account, topic));

export const setGroupMembersQueryData = (
  account: string,
  topic: ConversationTopic,
  members: GroupMembersSelectData,
  options?: SetDataOptions
) => {
  queryClient.setQueryData<GroupMembersSelectData>(
    groupMembersQueryKey(account, topic),
    members,
    options
  );
};

export const cancelGroupMembersQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.cancelQueries({
    queryKey: groupMembersQueryKey(account, topic),
  });
};

export const invalidateGroupMembersQuery = (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.invalidateQueries({
    queryKey: groupMembersQueryKey(account, topic),
  });
};

export function refetchGroupMembersQuery(
  account: string,
  topic: ConversationTopic
) {
  return queryClient.refetchQueries({
    queryKey: groupMembersQueryKey(account, topic),
  });
}
