import type { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getGroupQueryData,
  updateGroupQueryData,
  useGroupQuery,
} from "@/features/groups/group.query"
import { updateXmtpGroupName } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { captureError } from "@/utils/capture-error"
import { IGroup } from "./group.types"

export function useGroupNameMutation(args: {
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
}) {
  const { xmtpConversationId, clientInboxId } = args

  const { data: group } = useGroupQuery({ clientInboxId, xmtpConversationId })

  return useMutation({
    mutationFn: async (name: string) => {
      if (!group || !xmtpConversationId) {
        throw new Error("Missing required data in useGroupNameMutation")
      }

      await updateXmtpGroupName({
        clientInboxId,
        groupId: group.xmtpId,
        name,
      })

      return name
    },
    onMutate: async (name: string) => {
      const previousGroup = getGroupQueryData({ clientInboxId, xmtpConversationId })
      const updates: Partial<IGroup> = { name }

      if (previousGroup) {
        updateGroupQueryData({ clientInboxId, xmtpConversationId, updates })
      }

      updateConversationInAllowedConsentConversationsQueryData({
        clientInboxId,
        xmtpConversationId,
        conversationUpdate: updates,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      captureError(error)

      const { previousGroup } = context || {}

      const updates: Partial<IGroup> = { name: previousGroup?.name ?? "" }

      updateGroupQueryData({ clientInboxId, xmtpConversationId, updates })
      updateConversationInAllowedConsentConversationsQueryData({
        clientInboxId,
        xmtpConversationId,
        conversationUpdate: updates,
      })
    },
  })
}
