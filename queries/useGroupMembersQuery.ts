import {
  SetDataOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/getCleanAddress";
import { ConversationTopic, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { groupMembersQueryKey } from "./QueryKeys";
import { EntityObjectWithAddress, entifyWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";

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

const groupMembersQueryConfig = (
  account: string,
  group: GroupWithCodecsType | undefined | null,
  enabled: boolean
): UseQueryOptions<GroupMembersSelectData> => ({
  queryKey: groupMembersQueryKey(account, group?.topic!),
  queryFn: () => fetchGroupMembers(group!),
  enabled,
});

export const useGroupMembersQuery = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery(account, topic);
  const enabled = !!group && !!topic;
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig(account, group, enabled)
  );
};

export const useGroupMembersConversationScreenQuery = (
  account: string,
  topic: ConversationTopic
) => {
  const { data: group } = useGroupQuery(account, topic);
  const enabled = !!group && !!topic;
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig(account, group, enabled)
  );
};

export const useConversationListMembersQuery = (
  account: string,
  group: GroupWithCodecsType | undefined | null
) => {
  const enabled = !!group && !group.imageUrlSquare;
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig(account, group, enabled)
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
