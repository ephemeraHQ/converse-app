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
import { IDm } from "@/features/dm/dm.types"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import {
  setXmtpConsentStateForInboxId,
  updateXmtpConsentForGroupsForInbox,
} from "../xmtp/xmtp-consent/xmtp-consent"

export function useAllowDmMutation() {
  const currentSenderInboxId = useSafeCurrentSender().inboxId

  return useMutation({
    mutationFn: async (args: { xmtpConversationId: IXmtpConversationId }) => {
      const { xmtpConversationId } = args

      await Promise.all([
        updateXmtpConsentForGroupsForInbox({
          clientInboxId: currentSenderInboxId,
          groupIds: [xmtpConversationId],
          consent: "allowed",
        }),
        setXmtpConsentStateForInboxId({
          peerInboxId: currentSenderInboxId,
          consent: "allowed",
        }),
      ])
    },
    onMutate: ({ xmtpConversationId }) => {
      const existingDm = getDmQueryData({
        clientInboxId: currentSenderInboxId,
        xmtpConversationId,
      })
      if (existingDm) {
        const updatedDm: IDm = {
          ...existingDm,
          consentState: "allowed",
        }

        setDmQueryData({
          clientInboxId: currentSenderInboxId,
          xmtpConversationId,
          dm: updatedDm,
        })

        // Add to main conversations list
        addConversationToAllowedConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })

        // Remove from requests
        removeConversationFromUnknownConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })

        return { previousDmConsent: existingDm.consentState }
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
          clientInboxId: currentSenderInboxId,
          xmtpConversationId,
          dm: previousDm,
        })

        // Add back in requests
        addConversationToUnknownConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })

        // Remove from main conversations list
        removeConversationFromAllowedConsentConversationsQuery({
          clientInboxId: currentSenderInboxId,
          conversationId: xmtpConversationId,
        })
      }
    },
  })
}
