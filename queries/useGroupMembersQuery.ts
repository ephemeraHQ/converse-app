import {
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
import { getGroupQueryData } from "./useGroupQuery";

export type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

const fetchGroupMembers = async (args: {
  account: string;
  topic: ConversationTopic;
}): Promise<EntityObjectWithAddress<Member, InboxId>> => {
  const { account, topic } = args;
  const group = getGroupQueryData({ account, topic });
  if (!group) {
    return {
      byId: {},
      byAddress: {},
      ids: [],
    };
  }
  const members = await group.members();

  return entifyWithAddress(
    members,
    (member) => member.inboxId,
    (member) => getCleanAddress(member.addresses[0])
  );
};

type IGroupMembersQueryConfig = {
  account: string;
  topic: ConversationTopic;
  queryOptions?: Partial<UseQueryOptions<GroupMembersSelectData>>;
};

const getGroupMemberQueryOptions = (
  args: IGroupMembersQueryConfig
): UseQueryOptions<GroupMembersSelectData> => {
  const { account, topic, queryOptions } = args;
  const isEnabled = !!topic && (queryOptions?.enabled ?? true);
  return {
    queryKey: groupMembersQueryKey(account, topic),
    queryFn: () => fetchGroupMembers({ account, topic }),
    enabled: isEnabled,
    ...queryOptions,
  };
};

export const useGroupMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
  queryOptions?: Partial<UseQueryOptions<GroupMembersSelectData>>;
}) => {
  const { account, topic, queryOptions } = args;
  return useQuery<GroupMembersSelectData>(
    getGroupMemberQueryOptions({ account, topic, queryOptions })
  );
};

export const useGroupMembersConversationScreenQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;

  return useQuery<GroupMembersSelectData>(
    getGroupMemberQueryOptions({ account, topic })
  );
};

export const useConversationListMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const queryOptions = { enabled: !!topic };

  return useQuery<GroupMembersSelectData>(
    getGroupMemberQueryOptions({ account, topic, queryOptions })
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
