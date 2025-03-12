import { useMutation } from "@tanstack/react-query"
import {
  ConversationTopic,
  MessageDeliveryStatus,
  MessageId,
  ReactionContent,
} from "@xmtp/react-native-sdk"
import { useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addConversationMessageQuery,
  refetchConversationMessages,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getConversationForCurrentAccount } from "@/features/conversation/utils/get-conversation-for-current-account"
import { contentTypesPrefixes } from "@/features/xmtp/xmtp-content-types/xmtp-content-types"
import { IXmtpConversationTopic, IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { captureErrorWithToast } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"

export function useRemoveReactionOnMessage(props: { topic: IXmtpConversationTopic }) {
  const { topic } = props

  const { mutateAsync: removeReactionMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: ReactionContent }) => {
      const { reaction } = variables
      const conversation = getConversationForCurrentAccount(topic)
      if (!conversation) {
        throw new Error("Conversation not found when removing reaction")
      }
      await conversation.send({
        reaction,
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
            id: getRandomId() as MessageId,
            contentTypeId: contentTypesPrefixes.reaction,
            sentNs: getTodayNs(),
            fallback: variables.reaction.content,
            deliveryStatus: MessageDeliveryStatus.PUBLISHED,
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
        caller: "useRemoveReactionOnMessage mutation onError",
      }).catch(captureErrorWithToast)
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
