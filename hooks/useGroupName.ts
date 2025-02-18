import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useProfilesQueries } from "@/features/profiles/profiles.query";
import { getGroupMembersQueryOptions } from "@/queries/useGroupMembersQuery";
import { useGroupNameMutation } from "@/queries/useGroupNameMutation";
import { useGroupNameQuery } from "@/queries/useGroupNameQuery";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupName = (args: {
  conversationTopic: ConversationTopic;
}) => {
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

  const { data: groupMembers, isLoading: isLoadingGroupMembers } = useQuery({
    ...getGroupMembersQueryOptions({ account, topic: conversationTopic }),
    enabled: !groupName && !!conversationTopic && !!account, // If we have the group name, we don't need to fetch the members
  });

  const { data: profiles, isLoading: isLoadingProfiles } = useProfilesQueries(
    groupMembers?.ids ?? []
  );
  const names = profiles?.map((profile) => profile?.name);

  const { mutateAsync } = useGroupNameMutation({
    account,
    topic: conversationTopic!,
  });

  return {
    groupName: groupName || names.join(", "),
    isLoading: groupNameLoading || isLoadingGroupMembers || isLoadingProfiles,
    isError,
    updateGroupName: mutateAsync,
  };
};
