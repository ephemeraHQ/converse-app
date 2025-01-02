import {
  SetDataOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/getCleanAddress";
import { ConversationTopic, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { entifyWithAddress, EntityObjectWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { groupMembersQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

const fetchGroupMembers = async (
  group: GroupWithCodecsType | undefined | null
) => {
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
  group: GroupWithCodecsType | undefined | null;
  queryOptions?: Partial<UseQueryOptions<GroupMembersSelectData>>;
};

const groupMembersQueryConfig = (
  args: IGroupMembersQueryConfig
): UseQueryOptions<GroupMembersSelectData> => {
  const { account, group, queryOptions } = args;
  const isEnabled = !!group && !!group.topic && (queryOptions?.enabled ?? true);
  return {
    queryKey: groupMembersQueryKey(account, group?.topic!),
    queryFn: () => fetchGroupMembers(group!),
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
  const { data: group } = useGroupQuery({ account, topic });
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ account, group, queryOptions })
  );
};

export const useGroupMembersConversationScreenQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });

  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ account, group })
  );
};

export const useConversationListMembersQuery = (args: {
  account: string;
  group: GroupWithCodecsType | undefined | null;
}) => {
  const { account, group } = args;
  const queryOptions = { enabled: !!group && !group.imageUrlSquare };

  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ account, group, queryOptions })
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
