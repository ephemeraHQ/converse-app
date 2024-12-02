import {
  QueryObserverOptions,
  SetDataOptions,
  useQuery,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/address";
import { ConversationTopic, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { groupMembersQueryKey } from "./QueryKeys";
import { entifyWithAddress, EntityObjectWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

export const useGroupMembersQuery = (
  account: string,
  topic: ConversationTopic | undefined,
  queryOptions?: Partial<QueryObserverOptions<GroupMembersSelectData>>
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery<GroupMembersSelectData>({
    queryKey: groupMembersQueryKey(account, topic!),
    queryFn: async () => {
      if (!group) {
        return {
          byId: {},
          byAddress: {},
          ids: [],
        };
      }
      const updatedMembers = await group.members();
      return entifyWithAddress(
        updatedMembers,
        (member) => member.inboxId,
        // TODO: Multiple addresses support
        (member) => getCleanAddress(member.addresses[0])
      );
    },
    enabled: !!group && !!topic,
    ...queryOptions,
  });
};

export const useGroupMembersConversationScreenQuery = (
  account: string,
  topic: ConversationTopic,
  queryOptions?: Partial<QueryObserverOptions<GroupMembersSelectData>>
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery<GroupMembersSelectData>({
    queryKey: groupMembersQueryKey(account, topic),
    queryFn: async () => {
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
        // TODO: Multiple addresses support
        (member) => getCleanAddress(member.addresses[0])
      );
    },
    enabled: !!group,
    ...queryOptions,
  });
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
  queryClient.setQueryData(
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
