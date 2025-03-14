import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { getGroupMembersQueryOptions } from "@/features/groups/group-members.query"
import { useGroupNameMutation } from "@/features/groups/group-name.mutation"
import { getGroupQueryOptions } from "@/features/groups/group.query"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"

export const useGroupName = (args: { conversationTopic: IConversationTopic }) => {
  const { conversationTopic } = args

  const currentSenderInboxId = useSafeCurrentSender().inboxId

  const {
    data: groupName,
    isLoading: groupNameLoading,
    isError,
  } = useQuery({
    ...getGroupQueryOptions({ inboxId: currentSenderInboxId, topic: conversationTopic }),
    select: (group) => group?.name ?? null,
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
