import { useQuery } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { getGroupMembersQueryOptions } from "@/features/groups/useGroupMembersQuery"
import { useGroupNameMutation } from "@/features/groups/useGroupNameMutation"
import { getGroupQueryOptions } from "@/features/groups/useGroupQuery"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"

export const useGroupName = (args: { conversationTopic: ConversationTopic }) => {
  const { conversationTopic } = args

  const account = useCurrentSenderEthAddress()!

  const {
    data: groupName,
    isLoading: groupNameLoading,
    isError,
  } = useQuery({
    ...getGroupQueryOptions({ account, topic: conversationTopic }),
    select: (group) => (isConversationGroup(group) ? group.name : undefined),
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
