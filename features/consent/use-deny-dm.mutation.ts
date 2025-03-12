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
import {
  IXmtpConversationId,
  IXmtpConversationTopic,
  IXmtpConversationWithCodecs,
  IXmtpDmWithCodecs,
  IXmtpInboxId,
} from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import {
  setXmtpConsentStateForInboxId,
  updateConsentForGroupsForAccount,
} from "../xmtp/xmtp-consent/xmtp-consent"

export function useDenyDmMutation() {
  const currentSenderInboxId = useSafeCurrentSender().inboxId

  return useMutation({
    mutationFn: async (args: {
      peerInboxId: IXmtpInboxId
      conversationId: IXmtpConversationId
      topic: IXmtpConversationTopic
    }) => {
      const { peerInboxId, conversationId } = args

      if (!peerInboxId) {
        throw new Error("Peer inbox id not found")
      }

      await Promise.all([
        updateConsentForGroupsForAccount({
          clientInboxId: currentSenderInboxId,
          groupIds: [conversationId],
          consent: "denied",
        }),
        setXmtpConsentStateForInboxId({
          inboxId: currentSenderInboxId,
          consent: "denied",
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
          state: "denied",
        })

        setDmQueryData({
          ethAccountAddress: currentSenderInboxId,
          inboxId: peerInboxId,
          dm: updatedDm as IXmtpDmWithCodecs,
        })

        // Remove from main conversations list
        removeConversationFromAllowedConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          topic,
        })

        // Remove from requests
        removeConversationFromUnknownConsentConversationsQueryData({
          inboxId: currentSenderInboxId,
          topic,
        })

        return { previousDmConsent: conversation.state }
      }
    },
    onError: (error, { topic, peerInboxId }, context) => {
      const { previousDmConsent } = context || {}
      if (previousDmConsent) {
        const dm = getDmQueryData({
          ethAccountAddress: currentSenderInboxId,
          inboxId: peerInboxId,
        })

        if (!dm) {
          return
        }

        const previousDm = updateObjectAndMethods(dm, {
          state: previousDmConsent,
        })

        setDmQueryData({
          ethAccountAddress: currentSenderInboxId,
          inboxId: peerInboxId,
          dm: previousDm,
        })

        // Add back to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          conversation: previousDm as IXmtpConversationWithCodecs,
        })

        // Add back to requests
        addConversationToUnknownConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          conversation: previousDm as IXmtpConversationWithCodecs,
        })
      }
    },
  })
}
