import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addConversationMessageQuery,
  refetchConversationMessages,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getConversationForCurrentAccount } from "@/features/conversation/utils/get-conversation-for-current-account"
import { contentTypesPrefixes } from "@/features/xmtp/xmtp-content-types/xmtp-content-types"
import {
  IXmtpConversationTopic,
  IXmtpMessageDeliveryStatusValues,
  IXmtpMessageId,
  IXmtpReactionContent,
} from "@/features/xmtp/xmtp.types"
import { captureErrorWithToast } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"
import { Haptics } from "@/utils/haptics"

export function useReactOnMessage(props: { topic: IXmtpConversationTopic }) {
  const { topic } = props

  const { mutateAsync: reactOnMessageMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: IXmtpReactionContent }) => {
      const { reaction } = variables
      const conversation = getConversationForCurrentAccount(topic)
      if (!conversation) {
        throw new Error("Conversation not found when reacting on message")
      }
      await conversation.send({
        reaction,
      })
    },
    onMutate: (variables) => {
      const currentSender = getSafeCurrentSender()
      const conversation = getConversationForCurrentAccount(topic)

      if (conversation) {
        // Add the reaction to the message
        addConversationMessageQuery({
          clientInboxId: currentSender.inboxId,
          topic: conversation.topic,
          message: {
            id: getRandomId() as IXmtpMessageId,
            contentTypeId: contentTypesPrefixes.reaction,
            sentNs: getTodayNs(),
            fallback: variables.reaction.content,
            deliveryStatus: IXmtpMessageDeliveryStatusValues.PUBLISHED,
            topic: conversation.topic,
            senderInboxId: currentSender.inboxId,
            nativeContent: {},
            content: () => {
              return variables.reaction
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
    async (args: { messageId: IXmtpMessageId; emoji: string }) => {
      try {
        Haptics.softImpactAsync()
        await reactOnMessageMutationAsync({
          reaction: {
            reference: args.messageId,
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
