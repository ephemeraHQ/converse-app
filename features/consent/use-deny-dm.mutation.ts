import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQuery,
} from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getDmQueryData, setDmQueryData } from "@/features/dm/dm.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import {
  setXmtpConsentStateForInboxId,
  updateXmtpConsentForGroupsForInbox,
} from "../xmtp/xmtp-consent/xmtp-consent"

export function useDenyDmMutation() {
  const currentSenderInboxId = useSafeCurrentSender().inboxId

  return useMutation({
    mutationFn: async (args: {
      peerInboxId: IXmtpInboxId
      xmtpConversationId: IXmtpConversationId
    }) => {
      const { peerInboxId, xmtpConversationId } = args

      await Promise.all([
        updateXmtpConsentForGroupsForInbox({
          clientInboxId: currentSenderInboxId,
          groupIds: [xmtpConversationId],
          consent: "denied",
        }),
        setXmtpConsentStateForInboxId({
          peerInboxId,
          consent: "denied",
        }),
      ])
    },
    onMutate: ({ xmtpConversationId }) => {
      const conversation = getDmQueryData({
        clientInboxId: currentSenderInboxId,
        xmtpConversationId,
      })

      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          consentState: "denied",
        })

        setDmQueryData({
          clientInboxId: currentSenderInboxId,
          xmtpConversationId,
          dm: updatedDm,
        })

        // Remove from main conversations list
        removeConversationFromAllowedConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })

        // Remove from requests
        removeConversationFromUnknownConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })

        return { previousDmConsent: conversation.consentState }
      }
    },
    onError: (error, { xmtpConversationId }, context) => {
      const { previousDmConsent } = context || {}

      if (previousDmConsent) {
        const dm = getDmQueryData({
          clientInboxId: currentSenderInboxId,
          xmtpConversationId,
        })

        if (!dm) {
          return
        }

        const previousDm = updateObjectAndMethods(dm, {
          consentState: previousDmConsent,
        })

        setDmQueryData({
          xmtpConversationId,
          clientInboxId: currentSenderInboxId,
          dm: previousDm,
        })

        // Add back to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })

        // Add back to requests
        addConversationToUnknownConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })
      }
    },
  })
}
