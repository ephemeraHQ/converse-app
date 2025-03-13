import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { useGroupMembersQuery } from "@/features/groups/useGroupMembersQuery"

export function useGroupMember(args: {
  memberInboxId: IXmtpInboxId | undefined
  topic: IConversationTopic
}) {
  const { memberInboxId, topic } = args

  const currentSender = useSafeCurrentSender()

  const { data: members, isLoading: isLoadingMembers } = useGroupMembersQuery({
    clientInboxId: currentSender.inboxId,
    topic,
    caller: "useGroupMember",
  })

  return {
    groupMember: memberInboxId ? members?.byId[memberInboxId] : undefined,
    isLoadingGroupMember: isLoadingMembers,
  }
}
