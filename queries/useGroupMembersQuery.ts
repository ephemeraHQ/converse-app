import {
  SetDataOptions,
  useQuery,
  UseQueryOptions,
  queryOptions as reactQueryOptions,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/getCleanAddress";
import { ConversationTopic, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { entifyWithAddress, EntityObjectWithAddress } from "./entify";
import { queryClient } from "./queryClient";
import { groupMembersQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export type GroupMembersMap = EntityObjectWithAddress<Member, InboxId>;

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
  // note(lustig) this may break after we upgrade to xmtp without client in serializable types?
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
  queryOptions?: Partial<UseQueryOptions<GroupMembersMap>>;
};

const groupMembersQueryConfig = (
  args: IGroupMembersQueryConfig
): UseQueryOptions<GroupMembersMap> => {
  const { account, group, queryOptions } = args;
  const isEnabled = !!group && !!group.topic && (queryOptions?.enabled ?? true);
  return reactQueryOptions({
    queryKey: groupMembersQueryKey(account, group?.topic!),
    queryFn: () => fetchGroupMembers(group!),
    enabled: isEnabled,
    ...queryOptions,
  });
};

export const useGroupMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
  /** @deprecated this name collides with queryOptions from react-query, needs to be renamed eventually */
  queryOptions?: Partial<UseQueryOptions<GroupMembersMap>>;
}) => {
  const { account, topic, queryOptions } = args;
  const { data: group } = useGroupQuery({ account, topic });
  return useQuery(groupMembersQueryConfig({ account, group, queryOptions }));
};

export const useGroupMembersConversationScreenQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });

  return useQuery<GroupMembersMap>(groupMembersQueryConfig({ account, group }));
};

export const useConversationListMembersQuery = (args: {
  account: string;
  group: GroupWithCodecsType | undefined | null;
}) => {
  const { account, group } = args;
  const queryOptions = { enabled: !!group && !group.imageUrlSquare };

  return useQuery<GroupMembersMap>(
    groupMembersQueryConfig({ account, group, queryOptions })
  );
};

export const getGroupMembersQueryData = (
  account: string,
  topic: ConversationTopic
): GroupMembersMap | undefined =>
  queryClient.getQueryData(groupMembersQueryKey(account, topic));

export const setGroupMembersQueryData = (
  account: string,
  topic: ConversationTopic,
  members: GroupMembersMap,
  options?: SetDataOptions
) => {
  queryClient.setQueryData<GroupMembersMap>(
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
