import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addMessageToConversationMessagesQueryData,
  removeMessageToConversationMessagesQueryData,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import {
  getXmtpConversationTopicFromXmtpId,
  sendXmtpConversationMessage,
} from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { IXmtpConversationId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"
import { IConversationMessageReactionContent } from "./conversation-message/conversation-message.types"

export function useRemoveReactionOnMessage(props: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = props

  const currentSender = getSafeCurrentSender()

  const { mutateAsync: removeReactionMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: IConversationMessageReactionContent }) => {
      const { reaction } = variables

      await sendXmtpConversationMessage({
        conversationId: xmtpConversationId,
        clientInboxId: currentSender.inboxId,
        content: {
          reaction,
        },
      })
    },
    onMutate: async (variables) => {
      const currentSender = getSafeCurrentSender()

      const tempOptimisticId = getRandomId()

      // Add the removal reaction message
      addMessageToConversationMessagesQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        message: {
          xmtpId: "" as IXmtpMessageId,
          senderInboxId: currentSender.inboxId,
          xmtpTopic: getXmtpConversationTopicFromXmtpId(xmtpConversationId),
          type: "reaction",
          sentNs: getTodayNs(),
          status: "sent",
          xmtpConversationId,
          content: variables.reaction,
        },
      })

      return {
        tempOptimisticId,
      }
    },
    onError: (_, variables, context) => {
      if (!context) {
        return
      }

      // Remove the reaction message
      removeMessageToConversationMessagesQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        messageId: variables.reaction.reference,
      })
    },
  })

  const removeReactionOnMessage = useCallback(
    (args: { messageId: IXmtpMessageId; emoji: string }) => {
      return removeReactionMutationAsync({
        reaction: {
          reference: args.messageId,
          content: args.emoji,
          schema: "unicode",
          action: "removed",
        },
      })
    },
    [removeReactionMutationAsync],
  )

  return {
    removeReactionOnMessage,
  }
}
