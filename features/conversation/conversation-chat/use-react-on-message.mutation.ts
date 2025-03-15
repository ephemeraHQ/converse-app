import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addMessageToConversationMessagesQuery,
  refetchConversationMessages,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getConversationForCurrentAccount } from "@/features/conversation/utils/get-conversation-for-current-account"
import { sendXmtpConversationMessage } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { captureErrorWithToast } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"
import { Haptics } from "@/utils/haptics"
import { IConversationTopic } from "../conversation.types"
import {
  IConversationMessageId,
  IConversationMessageReactionContent,
} from "./conversation-message/conversation-message.types"

export function useReactOnMessage(props: { topic: IConversationTopic }) {
  const { topic } = props

  const { mutateAsync: reactOnMessageMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: IConversationMessageReactionContent }) => {
      const { reaction } = variables
      const conversation = getConversationForCurrentAccount(topic)
      if (!conversation) {
        throw new Error("Conversation not found when reacting on message")
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
        // Add the reaction to the message
        addMessageToConversationMessagesQuery({
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
        caller: "useReactOnMessage mutation onError",
      }).catch(captureErrorWithToast)
    },
  })

  const reactOnMessage = useCallback(
    async (args: { messageId: IConversationMessageId; emoji: string }) => {
      try {
        Haptics.softImpactAsync()
        await reactOnMessageMutationAsync({
          reaction: {
            reference: args.messageId as IConversationMessageId,
            content: args.emoji,
            schema: "unicode",
            action: "added",
          },
        })
      } catch (error) {
        captureErrorWithToast(error)
      }
    },
    [reactOnMessageMutationAsync],
  )

  return {
    reactOnMessage,
  }
}
