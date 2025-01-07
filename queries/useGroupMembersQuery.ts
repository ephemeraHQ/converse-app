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
  inboxId: string | undefined;
  group: GroupWithCodecsType | undefined | null;
  queryOptions?: Partial<UseQueryOptions<GroupMembersSelectData>>;
};

const groupMembersQueryConfig = (
  args: IGroupMembersQueryConfig
): UseQueryOptions<GroupMembersSelectData> => {
  const { inboxId, group, queryOptions } = args;
  const isEnabled =
    !!inboxId && !!group && !!group.topic && (queryOptions?.enabled ?? true);
  return {
    queryKey: groupMembersQueryKey({ inboxId, topic: group?.topic! }),
    queryFn: () => fetchGroupMembers(group!),
    enabled: isEnabled,
    ...queryOptions,
  };
};

export const useGroupMembersQuery = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
  queryOptions?: Partial<UseQueryOptions<GroupMembersSelectData>>;
}) => {
  const { inboxId, topic, queryOptions } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ inboxId, group, queryOptions })
  );
};

export const useGroupMembersConversationScreenQuery = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  const { data: group } = useGroupQuery({ inboxId, topic });

  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ inboxId, group })
  );
};

export const useConversationListMembersQuery = (args: {
  inboxId: string;
  group: GroupWithCodecsType | undefined | null;
}) => {
  const { inboxId, group } = args;
  const queryOptions = { enabled: !!group && !group.imageUrlSquare };

  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ inboxId, group, queryOptions })
  );
};

export const getGroupMembersQueryData = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}): GroupMembersSelectData | undefined => {
  if (!args.inboxId) {
    return undefined;
  }
  return queryClient.getQueryData(groupMembersQueryKey(args));
};

export const setGroupMembersQueryData = (
  args: {
    inboxId: string | undefined;
    topic: ConversationTopic;
  },
  members: GroupMembersSelectData,
  options?: SetDataOptions
) => {
  if (!args.inboxId) {
    return;
  }
  queryClient.setQueryData<GroupMembersSelectData>(
    groupMembersQueryKey(args),
    members,
    options
  );
};

export const cancelGroupMembersQuery = async (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  if (!args.inboxId) {
    return;
  }
  return queryClient.cancelQueries({
    queryKey: groupMembersQueryKey(args),
  });
};

export const invalidateGroupMembersQuery = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  if (!args.inboxId) {
    return;
  }
  return queryClient.invalidateQueries({
    queryKey: groupMembersQueryKey(args),
  });
};
