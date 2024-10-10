import {
  QueryObserverOptions,
  SetDataOptions,
  useQuery,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/address";
import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { groupMembersQueryKey } from "./QueryKeys";
import { entifyWithAddress, EntityObjectWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

export const useGroupMembersQuery = (
  account: string,
  topic: string,
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
      const updatedMembers = await group.membersList();
      return entifyWithAddress(
        updatedMembers,
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
  topic: string
): GroupMembersSelectData | undefined =>
  queryClient.getQueryData(groupMembersQueryKey(account, topic));

export const setGroupMembersQueryData = (
  account: string,
  topic: string,
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
  topic: string
) => {
  return queryClient.cancelQueries({
    queryKey: groupMembersQueryKey(account, topic),
  });
};

export const invalidateGroupMembersQuery = (account: string, topic: string) => {
  return queryClient.invalidateQueries({
    queryKey: groupMembersQueryKey(account, topic),
  });
};
