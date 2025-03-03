import { useQuery } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { getGroupMembersQueryOptions } from "@/queries/useGroupMembersQuery"
import { useGroupNameMutation } from "@/queries/useGroupNameMutation"
import { useGroupNameQuery } from "@/queries/useGroupNameQuery"

export const useGroupName = (args: { conversationTopic: ConversationTopic }) => {
  const { conversationTopic } = args

  const account = useCurrentSenderEthAddress()!

  const {
    data: groupName,
    isLoading: groupNameLoading,
    isError,
  } = useGroupNameQuery({
    account,
    topic: conversationTopic,
  })

  const { data: groupMembers, isLoading: isLoadingGroupMembers } = useQuery({
    ...getGroupMembersQueryOptions({ account, topic: conversationTopic }),
    enabled: !groupName && !!conversationTopic && !!account, // If we have the group name, we don't need to fetch the members
  })

  const preferredDisplayData = usePreferredDisplayInfoBatch({
    xmtpInboxIds: groupMembers?.ids ?? [],
  })

  const names = preferredDisplayData?.map((profile) => profile?.displayName)

  const { mutateAsync } = useGroupNameMutation({
    account,
    topic: conversationTopic!,
  })

  return {
    groupName: groupName || names.join(", "),
    isLoading:
      groupNameLoading ||
      isLoadingGroupMembers ||
      preferredDisplayData.some((profile) => profile.isLoading),
    isError,
    updateGroupName: mutateAsync,
  }
}
