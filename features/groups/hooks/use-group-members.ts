import { useQuery } from "@tanstack/react-query"
import { getGroupQueryOptions } from "@/features/groups/queries/group.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function useGroupMembers(args: {
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
  caller: string
}) {
  const { xmtpConversationId, clientInboxId, caller } = args

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    ...getGroupQueryOptions({
      clientInboxId,
      xmtpConversationId,
      caller,
    }),
    select: (group) => group?.members,
  })

  return {
    members,
    isLoading: isLoadingMembers,
  }
}
