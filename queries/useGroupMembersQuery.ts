import { useQuery } from "@tanstack/react-query";
import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { groupMembersQueryKey } from "./QueryKeys";
import { entifyWithAddress, EntityObjectWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

type GroupMembersRawData = Member[] | undefined;
type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

export const useGroupMembersQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery<GroupMembersRawData, unknown, GroupMembersSelectData>({
    queryKey: groupMembersQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      const members = await group.members();
      return members;
    },
    enabled: !!group,
    select: (data): EntityObjectWithAddress<Member, InboxId> => {
      if (!data) {
        return {
          byId: {},
          byAddress: {},
          ids: [],
        };
      }
      return entifyWithAddress(
        data,
        (member) => member.inboxId,
        // TODO: Multiple addresses support
        (member) => member.addresses[0]
      );
    },
  });
};

export const getGroupMembersQueryData = (
  account: string,
  topic: string
): GroupMembersRawData | undefined =>
  queryClient.getQueryData(groupMembersQueryKey(account, topic));

export const setGroupMembersQueryData = (
  account: string,
  topic: string,
  members: GroupMembersRawData
) => {
  queryClient.setQueryData(groupMembersQueryKey(account, topic), members);
};

export const cancelGroupMembersQuery = async (
  account: string,
  topic: string
) => {
  return queryClient.cancelQueries({
    queryKey: groupMembersQueryKey(account, topic),
  });
};
