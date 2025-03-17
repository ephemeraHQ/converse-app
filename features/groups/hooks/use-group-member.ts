import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useGroupMembers } from "@/features/groups/hooks/use-group-members"

export function useGroupMember(args: {
  memberInboxId: IXmtpInboxId | undefined
  xmtpConversationId: IXmtpConversationId
}) {
  const { memberInboxId, xmtpConversationId } = args

  const currentSender = useSafeCurrentSender()

  const { members, isLoading: isLoadingMembers } = useGroupMembers({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "useGroupMember",
  })

  return {
    groupMember: memberInboxId ? members?.byId[memberInboxId] : undefined,
    isLoadingGroupMember: isLoadingMembers,
  }
}
