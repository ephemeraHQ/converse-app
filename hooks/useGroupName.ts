import { getGroupMembersQueryOptions } from "@/queries/useGroupMembersQuery";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useGroupNameMutation } from "@/queries/useGroupNameMutation";
import { useGroupNameQuery } from "@/queries/useGroupNameQuery";

// export function useProfileNames(inboxIds: InboxId[] | undefined) {

export const useGroupName = (args: {
  conversationTopic: ConversationTopic;
}) => {
  return "toodo: group name";
  const { conversationTopic } = args;

  const account = useCurrentAccount()!;

  const {
    data: groupName,
    isLoading: groupNameLoading,
    isError,
  } = useGroupNameQuery({
    account,
    topic: conversationTopic,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    ...getGroupMembersQueryOptions({ account, topic: conversationTopic }),
    enabled: !groupName && !!conversationTopic && !!account, // If we have the group name, we don't need to fetch the members
  });

  const memberAddresses = members?.ids
    .map((id) => members?.byId[id]?.addresses[0])
    .filter((address) => address !== account);

  const names = usePreferredNames(memberAddresses ?? []);

  const { mutateAsync } = useGroupNameMutation({
    account,
    topic: conversationTopic!,
  });

  return {
    groupName: groupName || names.join(", "),
    isLoading: groupNameLoading || membersLoading,
    isError,
    updateGroupName: mutateAsync,
  };
};
