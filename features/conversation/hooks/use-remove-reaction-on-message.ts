import { useMutation } from "@tanstack/react-query"
import {
  ConversationTopic,
  MessageDeliveryStatus,
  MessageId,
  ReactionContent,
} from "@xmtp/react-native-sdk"
import { useCallback } from "react"
import {
  getCurrentSenderEthAddress,
  getSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import {
  addConversationMessageQuery,
  refetchConversationMessages,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getConversationForCurrentAccount } from "@/features/conversation/utils/get-conversation-for-current-account"
import { contentTypesPrefixes } from "@/features/xmtp/xmtp-content-types/xmtp-content-types"
import { captureErrorWithToast } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"

export function useRemoveReactionOnMessage(props: { topic: ConversationTopic }) {
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
      const currentAccount = getCurrentSenderEthAddress()!
      const { inboxId: currentInboxId } = getSafeCurrentSender()
      const conversation = getConversationForCurrentAccount(topic)

      if (conversation) {
        // Add the removal reaction message
        addConversationMessageQuery({
          account: currentAccount,
          topic: conversation.topic,
          message: {
            id: getRandomId() as MessageId,
            contentTypeId: contentTypesPrefixes.reaction,
            sentNs: getTodayNs(),
            fallback: variables.reaction.content,
            deliveryStatus: MessageDeliveryStatus.PUBLISHED,
            topic: conversation.topic,
            senderInboxId: currentInboxId,
            nativeContent: {},
            content: () => {
              return variables.reaction
            },
          },
        })
      }
    },
    onError: (error) => {
      const currentAccount = getCurrentSenderEthAddress()!
      refetchConversationMessages({
        account: currentAccount,
        topic,
        caller: "useRemoveReactionOnMessage mutation onError",
      }).catch(captureErrorWithToast)
    },
  })

  const removeReactionFromMessage = useCallback(
    async (args: { messageId: MessageId; emoji: string }) => {
      try {
        await removeReactionMutationAsync({
          reaction: {
            reference: args.messageId,
            content: args.emoji,
            schema: "unicode",
            action: "removed",
          },
        })
      } catch (error) {
        captureErrorWithToast(error)
      }
    },
    [removeReactionMutationAsync],
  )

  return removeReactionFromMessage
}
