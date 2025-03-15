import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { getGroupMembersQueryOptions } from "@/features/groups/group-members.query"
import { useGroupNameMutation } from "@/features/groups/group-name.mutation"
import { getGroupQueryOptions } from "@/features/groups/group.query"
import { getPreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function getGroupNameForGroupMembers(args: { memberInboxIds: IXmtpInboxId[] }) {
  const { memberInboxIds } = args

  const groupName = getGroupNameForMemberNames({
    names: memberInboxIds.map(
      (inboxId) =>
        getPreferredDisplayInfo({
          inboxId,
        }).displayName ?? "",
    ),
  })

  return groupName
}

export const useGroupName = (args: { conversationTopic: IConversationTopic }) => {
  const { conversationTopic } = args

  const currentSenderInboxId = useSafeCurrentSender().inboxId

  const {
    data: groupName,
    isLoading: groupNameLoading,
    isError,
  } = useQuery({
    ...getGroupQueryOptions({
      clientInboxId: currentSenderInboxId,
      topic: conversationTopic,
      caller: "useGroupName",
    }),
    select: (group) => {
      if (!group) {
        return null
      }
      if (!isConversationGroup(group)) {
        throw new Error("Expected group conversation but received different type")
      }
      return group.name
    },
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

  const memberPreferedDisplayNames = preferredDisplayData?.map(
    (profile) => profile?.displayName || "",
  )

  const { mutateAsync } = useGroupNameMutation({
    clientInboxId: currentSenderInboxId,
    topic: conversationTopic!,
  })

  return {
    groupName: groupName || getGroupNameForMemberNames({ names: memberPreferedDisplayNames }),
    isLoading:
      groupNameLoading ||
      isLoadingGroupMembers ||
      preferredDisplayData.some((profile) => profile.isLoading),
    isError,
    updateGroupName: mutateAsync,
  }
}

function getGroupNameForMemberNames(args: { names: string[] }) {
  return args.names.join(", ")
}
