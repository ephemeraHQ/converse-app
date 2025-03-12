import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { getGroupMembersQueryOptions } from "@/features/groups/useGroupMembersQuery"
import { useGroupNameMutation } from "@/features/groups/useGroupNameMutation"
import { getGroupQueryOptions } from "@/features/groups/useGroupQuery"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"

export const useGroupName = (args: { conversationTopic: IXmtpConversationTopic }) => {
  const { conversationTopic } = args

  const currentSenderInboxId = useSafeCurrentSender().inboxId

  const {
    data: groupName,
    isLoading: groupNameLoading,
    isError,
  } = useQuery({
    ...getGroupQueryOptions({ inboxId: currentSenderInboxId, topic: conversationTopic }),
    select: (group) => (isConversationGroup(group) ? group.groupName : undefined),
  })

  const { data: groupMembers, isLoading: isLoadingGroupMembers } = useQuery({
    ...getGroupMembersQueryOptions({
      clientInboxId: currentSenderInboxId,
      topic: conversationTopic,
    }),
    enabled: !groupName && !!conversationTopic && !!currentSenderInboxId, // If we have the group name, we don't need to fetch the members
  })

  const preferredDisplayData = usePreferredDisplayInfoBatch({
    xmtpInboxIds: groupMembers?.ids ?? [],
  })

  const names = preferredDisplayData?.map((profile) => profile?.displayName)

  const { mutateAsync } = useGroupNameMutation({
    clientInboxId: currentSenderInboxId,
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
