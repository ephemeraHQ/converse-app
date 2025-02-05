import { getOrFetchConversation } from "@/queries/conversation-query";
import {
  queryOptions as reactQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { getCleanAddress } from "@utils/evm/getCleanAddress";
import { ConversationTopic, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";
import { groupMembersQueryKey } from "./QueryKeys";
import { EntityObjectWithAddress, entifyWithAddress } from "./entify";
import { queryClient } from "./queryClient";

export type GroupMembersSelectData = EntityObjectWithAddress<Member, InboxId>;

const fetchGroupMembers = async (args: {
  account: string;
  topic: ConversationTopic;
}): Promise<EntityObjectWithAddress<Member, InboxId>> => {
  const { account, topic } = args;

  const conversation = await getOrFetchConversation({
    account,
    topic,
    caller: "fetchGroupMembers",
  });

  if (!conversation) {
    throw new Error(`Group ${topic} not found in query data cache`);
  }

  const members = await conversation.members();

  return entifyWithAddress(
    members,
    (member) => member.inboxId,
    (member) => getCleanAddress(member.addresses[0])
  );
};

export const getGroupMembersQueryOptions = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const isEnabled = !!topic;
  return reactQueryOptions({
    queryKey: groupMembersQueryKey(account, topic),
    queryFn: () => fetchGroupMembers({ account, topic }),
    enabled: isEnabled,
  });
};

export const useGroupMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return useQuery(getGroupMembersQueryOptions({ account, topic }));
};

export const getGroupMembersQueryData = (args: {
  account: string;
  topic: ConversationTopic;
}): GroupMembersSelectData | undefined => {
  const { account, topic } = args;
  return queryClient.getQueryData(
    getGroupMembersQueryOptions({ account, topic }).queryKey
  );
};

export const setGroupMembersQueryData = (args: {
  account: string;
  topic: ConversationTopic;
  members: GroupMembersSelectData;
}) => {
  const { account, topic, members } = args;
  queryClient.setQueryData(
    getGroupMembersQueryOptions({ account, topic }).queryKey,
    members
  );
};

export const cancelGroupMembersQuery = async (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return queryClient.cancelQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  });
};

export const invalidateGroupMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return queryClient.invalidateQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  });
};

export function refetchGroupMembersQuery(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryClient.refetchQueries({
    queryKey: getGroupMembersQueryOptions({ account, topic }).queryKey,
  });
}

export async function ensureGroupMembersQueryData(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryClient.ensureQueryData(
    getGroupMembersQueryOptions({
      account,
      topic,
    })
  );
}
