import { useMutation } from "@tanstack/react-query"
import { logger } from "@utils/logger"
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQueryData,
} from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getGroupQueryData, setGroupQueryData } from "@/features/groups/group.query"
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
        xmtpConversationId,
      })

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQueryData({
        inboxId: clientInboxId,
        xmtpConversationId,
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
        conversation: context.previousGroup,
      })

      // Add back to requests
      addConversationToUnknownConsentConversationsQuery({
        inboxId: clientInboxId,
        conversation: context.previousGroup,
      })
    },
    onSuccess: () => {
      logger.debug("onSuccess useBlockGroupMutation")
    },
  })
}
