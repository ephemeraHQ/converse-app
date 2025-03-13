import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addConversationToAllowedConsentConversationsQuery,
  removeConversationFromAllowedConsentConversationsQuery,
} from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  addConversationToUnknownConsentConversationsQuery,
  removeConversationFromUnknownConsentConversationsQueryData,
} from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { getDmQueryData, setDmQueryData } from "@/features/dm/use-dm-query"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { IConversationId, IConversationTopic } from "../conversation/conversation.types"
import {
  setXmtpConsentStateForInboxId,
  updateConsentForGroupsForAccount,
} from "../xmtp/xmtp-consent/xmtp-consent"

export function useAllowDmMutation() {
  const currentSenderInboxId = useSafeCurrentSender().inboxId

  return useMutation({
    mutationFn: async (args: {
      peerInboxId: IXmtpInboxId
      conversationId: IConversationId
      topic: IConversationTopic
    }) => {
      const { peerInboxId, conversationId } = args
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found")
      }
      await Promise.all([
        updateConsentForGroupsForAccount({
          clientInboxId: currentSenderInboxId,
          groupIds: [conversationId],
          consent: "allowed",
        }),
        setXmtpConsentStateForInboxId({
          inboxId: currentSenderInboxId,
          consent: "allowed",
        }),
      ])
    },
    onMutate: ({ topic, peerInboxId }) => {
      const conversation = getConversationQueryData({
        inboxId: currentSenderInboxId,
        topic,
      })
      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          consentState: "allowed",
        })

        setDmQueryData({
          targetInboxId: currentSenderInboxId,
          clientInboxId: peerInboxId,
          dm: updatedDm,
        })

        // Add to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          conversation: updatedDm,
        })

        // Remove from requests
        removeConversationFromUnknownConsentConversationsQueryData({
          inboxId: currentSenderInboxId,
          topic,
        })

        return { previousDmConsent: conversation.consentState }
      }
    },
    onError: (error, { topic, peerInboxId }, context) => {
      const { previousDmConsent } = context || {}
      if (previousDmConsent) {
        const dm = getDmQueryData({
          targetInboxId: currentSenderInboxId,
          clientInboxId: peerInboxId,
        })

        if (!dm) {
          return
        }

        const previousDm = updateObjectAndMethods(dm, {
          consentState: previousDmConsent,
        })

        setDmQueryData({
          targetInboxId: currentSenderInboxId,
          clientInboxId: peerInboxId,
          dm: previousDm,
        })

        // Add back in requests
        addConversationToUnknownConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          conversation: previousDm,
        })

        // Remove from main conversations list
        removeConversationFromAllowedConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          topic,
        })
      }
    },
  })
}
