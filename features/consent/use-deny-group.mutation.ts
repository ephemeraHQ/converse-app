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
import { getConversationIdFromTopic } from "@/features/conversation/utils/get-conversation-id-from-topic"
import { getGroupQueryData, setGroupQueryData } from "@/features/groups/group.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { IConversationTopic } from "../conversation/conversation.types"
import { updateConsentForGroupsForInbox } from "../xmtp/xmtp-consent/xmtp-consent"

export const useDenyGroupMutation = (args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) => {
  const { clientInboxId, topic } = args

  return useMutation({
    mutationFn: async () => {
      if (!topic || !clientInboxId) {
        return
      }
      await updateConsentForGroupsForInbox({
        clientInboxId,
        groupIds: [getConversationIdFromTopic(topic) as unknown as IXmtpConversationId],
        consent: "denied",
      })
      return "denied"
    },
    onMutate: async () => {
      const previousGroup = getGroupQueryData({ inboxId: clientInboxId, topic })

      if (!previousGroup) {
        throw new Error("Previous group not found")
      }

      const updatedGroup = updateObjectAndMethods(previousGroup!, {
        consentState: "denied",
      })

      setGroupQueryData({ inboxId: clientInboxId, topic, group: updatedGroup })

      // Remove from main conversations list
      removeConversationFromAllowedConsentConversationsQuery({
        inboxId: clientInboxId,
        topic: topic!,
      })

      // Remove from requests
      removeConversationFromUnknownConsentConversationsQueryData({
        inboxId: clientInboxId,
        topic,
      })

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      if (!context) {
        return
      }

      setGroupQueryData({ inboxId: clientInboxId, topic, group: context.previousGroup })

      // Add back to main conversations list
      addConversationToAllowedConsentConversationsQuery({
        inboxId: clientInboxId,
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
