import { useMutation } from "@tanstack/react-query"
import { ConversationId, ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
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
import { IXmtpConversationWithCodecs, IXmtpDmWithCodecs } from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import {
  setXmtpConsentStateForInboxId,
  updateConsentForGroupsForAccount,
} from "../xmtp/xmtp-consent/xmtp-consent"

export function useAllowDmMutation() {
  const currentSenderInboxId = useSafeCurrentSender().inboxId

  return useMutation({
    mutationFn: async (args: {
      peerInboxId: InboxId
      conversationId: ConversationId
      topic: ConversationTopic
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
          state: "allowed",
        })

        setDmQueryData({
          ethAccountAddress: currentSenderInboxId,
          inboxId: peerInboxId,
          dm: updatedDm as IXmtpDmWithCodecs,
        })

        // Add to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          conversation: updatedDm as IXmtpConversationWithCodecs,
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

        // Add back in requests
        addConversationToUnknownConsentConversationsQuery({
          inboxId: currentSenderInboxId,
          conversation: previousDm as IXmtpConversationWithCodecs,
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
