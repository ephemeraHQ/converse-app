import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addMessageToConversationMessagesQueryData,
  refetchConversationMessagesQuery,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getConversationForCurrentAccount } from "@/features/conversation/utils/get-conversation-for-current-account"
import { sendXmtpConversationMessage } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { IXmtpConversationId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { captureErrorWithToast } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { GenericError } from "@/utils/error"
import { Haptics } from "@/utils/haptics"
import { IConversationMessageReactionContent } from "./conversation-message/conversation-message.types"

export function useReactOnMessage(props: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = props

  const { mutateAsync: reactOnMessageMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: IConversationMessageReactionContent }) => {
      const { reaction } = variables

      const conversation = getConversationForCurrentAccount(xmtpConversationId)

      if (!conversation) {
        throw new Error("Conversation not found when reacting on message")
      }

      const currentSender = getSafeCurrentSender()

      await sendXmtpConversationMessage({
        conversationId: conversation.xmtpId,
        clientInboxId: currentSender.inboxId,
        content: {
          reaction,
        },
      })
    },
    onMutate: async (variables) => {
      const currentSender = getSafeCurrentSender()
      const conversation = getConversationForCurrentAccount(xmtpConversationId)

      if (conversation) {
        // Add the reaction to the message
        addMessageToConversationMessagesQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId,
          message: {
            xmtpId: "" as IXmtpMessageId,
            xmtpConversationId,
            type: "reaction",
            sentNs: getTodayNs(),
            status: "sent",
            xmtpTopic: conversation.xmtpTopic,
            senderInboxId: currentSender.inboxId,
            content: variables.reaction,
          },
        })
      }
    },
    onError: (error) => {
      const currentSender = getSafeCurrentSender()
      refetchConversationMessagesQuery({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        caller: "useReactOnMessage mutation onError",
      }).catch(captureErrorWithToast)
    },
  })

  const reactOnMessage = useCallback(
    async (args: { messageId: IXmtpMessageId; emoji: string }) => {
      try {
        Haptics.softImpactAsync()
        await reactOnMessageMutationAsync({
          reaction: {
            reference: args.messageId as IXmtpMessageId,
            content: args.emoji,
            schema: "unicode",
            action: "added",
          },
        })
      } catch (error) {
        captureErrorWithToast(
          new GenericError({ error, additionalMessage: "Error reacting on message" }),
        )
      }
    },
    [reactOnMessageMutationAsync],
  )

  return {
    reactOnMessage,
  }
}
