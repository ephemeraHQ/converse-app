import { useMutation } from "@tanstack/react-query"
import { logger } from "@utils/logger"
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQuery,
} from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getGroupQueryData, setGroupQueryData } from "@/features/groups/queries/group.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { updateXmtpConsentForGroupsForInbox } from "../xmtp/xmtp-consent/xmtp-consent"

export const useDenyGroupMutation = (args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) => {
  const { clientInboxId, xmtpConversationId } = args

  return useMutation({
    mutationFn: async () => {
      await updateXmtpConsentForGroupsForInbox({
        clientInboxId,
        groupIds: [xmtpConversationId],
        consent: "denied",
      })
      return "denied"
    },
    onMutate: async () => {
      const previousGroup = getGroupQueryData({ clientInboxId, xmtpConversationId })

      if (!previousGroup) {
        throw new Error("Previous group not found")
      }

      const updatedGroup = updateObjectAndMethods(previousGroup!, {
        consentState: "denied",
      })

      setGroupQueryData({ clientInboxId, xmtpConversationId, group: updatedGroup })

      // Remove from main conversations list
      removeConversationFromAllowedConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      if (!context) {
        return
      }

      setGroupQueryData({
        clientInboxId,
        xmtpConversationId,
        group: context.previousGroup,
      })

      // Add back to main conversations list
      addConversationToAllowedConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })

      // Add back to requests
      addConversationToUnknownConsentConversationsQuery({
        clientInboxId,
        conversationId: xmtpConversationId,
      })
    },
    onSuccess: () => {
      logger.debug("onSuccess useBlockGroupMutation")
    },
  })
}
