import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addConversationMessageQuery,
  refetchConversationMessages,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getConversationForCurrentAccount } from "@/features/conversation/utils/get-conversation-for-current-account"
import { sendXmtpConversationMessage } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { captureErrorWithToast } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"
import { IConversationTopic } from "../conversation.types"
import {
  IConversationMessageId,
  IConversationMessageReactionContent,
} from "./conversation-message/conversation-message.types"

export function useRemoveReactionOnMessage(props: { topic: IConversationTopic }) {
  const { topic } = props

  const { mutateAsync: removeReactionMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: IConversationMessageReactionContent }) => {
      const { reaction } = variables
      const conversation = getConversationForCurrentAccount(topic)
      if (!conversation) {
        throw new Error("Conversation not found when removing reaction")
      }
      const currentSender = getSafeCurrentSender()
      await sendXmtpConversationMessage({
        conversationId: conversation.id as unknown as IXmtpConversationId,
        clientInboxId: currentSender.inboxId,
        content: {
          reaction,
        },
      })
    },
    onMutate: (variables) => {
      const currentSender = getSafeCurrentSender()
      const conversation = getConversationForCurrentAccount(topic)

      if (conversation) {
        // Add the removal reaction message
        addConversationMessageQuery({
          clientInboxId: currentSender.inboxId,
          topic: conversation.topic,
          message: {
            id: getRandomId() as IConversationMessageId,
            type: "reaction",
            sentNs: getTodayNs(),
            status: "sent",
            topic: conversation.topic,
            senderInboxId: currentSender.inboxId,
            content: {
              ...variables.reaction,
            },
          },
        })
      }
    },
    onError: (error) => {
      const currentSender = getSafeCurrentSender()
      refetchConversationMessages({
        clientInboxId: currentSender.inboxId,
        topic,
        caller: "useRemoveReactionOnMessage mutation onError",
      }).catch(captureErrorWithToast)
    },
  })

  const removeReactionOnMessage = useCallback(
    (args: { messageId: IConversationMessageId; emoji: string }) => {
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
