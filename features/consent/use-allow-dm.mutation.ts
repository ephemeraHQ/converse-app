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
import { getDmQueryData, setDmQueryData } from "@/features/dm/dm.query"
import { IDm } from "@/features/dm/dm.types"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { IConversationId, IConversationTopic } from "../conversation/conversation.types"
import {
  setXmtpConsentStateForInboxId,
  updateConsentForGroupsForInbox,
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
        updateConsentForGroupsForInbox({
          clientInboxId: currentSenderInboxId,
          groupIds: [conversationId as unknown as IXmtpConversationId],
          consent: "allowed",
        }),
        setXmtpConsentStateForInboxId({
          inboxId: currentSenderInboxId,
          consent: "allowed",
        }),
      ])
    },
    onMutate: ({ topic, peerInboxId }) => {
      const existingDm = getDmQueryData({
        clientInboxId: currentSenderInboxId,
        topic,
      })
      if (existingDm) {
        const updatedDm: IDm = {
          ...existingDm,
          consentState: "allowed",
        }

        setDmQueryData({
          clientInboxId: currentSenderInboxId,
          topic,
          dm: updatedDm,
        })

        // Add to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversation: updatedDm,
        })

        // Remove from requests
        removeConversationFromUnknownConsentConversationsQueryData({
          inboxId: currentSenderInboxId,
          topic,
        })

        return { previousDmConsent: existingDm.consentState }
      }
    },
    onError: (error, { topic, peerInboxId }, context) => {
      const { previousDmConsent } = context || {}
      if (previousDmConsent) {
        const dm = getDmQueryData({
          clientInboxId: currentSenderInboxId,
          topic,
        })

        if (!dm) {
          return
        }

        const previousDm = updateObjectAndMethods(dm, {
          consentState: previousDmConsent,
        })

        setDmQueryData({
          clientInboxId: currentSenderInboxId,
          topic,
          dm: previousDm,
        })

        // Add back in requests
        addConversationToUnknownConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          conversation: previousDm,
        })

        // Remove from main conversations list
        removeConversationFromAllowedConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          topic,
        })
      }
    },
  })
}
