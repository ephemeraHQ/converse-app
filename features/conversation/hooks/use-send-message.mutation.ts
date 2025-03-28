import { useMutation } from "@tanstack/react-query"
import { getCurrentSender, getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { messageContentIsReply } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { convertXmtpMessageToConvosMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/convert-xmtp-message-to-convos-message"
import { getMessageWithType } from "@/features/conversation/conversation-chat/conversation-message/utils/get-message-with-type"
import {
  addMessageToConversationMessagesQueryData,
  getConversationMessagesQueryOptions,
  IMessageAccumulator,
  invalidateConversationMessagesQuery,
  removeMessageToConversationMessagesQueryData,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import {
  getConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { convertConvosMessageContentToXmtpMessageContent } from "@/features/conversation/utils/convert-convos-message-content-to-xmtp-message-content"
import {
  getXmtpConversationTopicFromXmtpId,
  sendXmtpConversationMessage,
} from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { getXmtpConversationMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { IXmtpConversationId, IXmtpInboxId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { GenericError } from "@/utils/error"
import { getRandomId } from "@/utils/general"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import {
  IConversationMessage,
  IConversationMessageContent,
} from "../conversation-chat/conversation-message/conversation-message.types"

export type ISendMessageParams = {
  xmtpConversationId: IXmtpConversationId
  contents: IConversationMessageContent[] // Array because we can send text at same time as attachments for example
}

export async function sendMessage(args: ISendMessageParams) {
  const { contents, xmtpConversationId } = args

  const currentSender = getSafeCurrentSender()

  const results: {
    sentXmtpMessageIds: IXmtpMessageId[]
    sentMessages: IConversationMessage[]
  } = {
    sentXmtpMessageIds: [],
    sentMessages: [],
  }

  // Send each content as a separate message
  for (const content of contents) {
    let sentXmtpMessageId: IXmtpMessageId | null = null

    const payload = convertConvosMessageContentToXmtpMessageContent(content)

    if (messageContentIsReply(content)) {
      // Content is already a reply, send it with the inner content properly converted
      const innerPayload = convertConvosMessageContentToXmtpMessageContent(content.content)

      sentXmtpMessageId = await sendXmtpConversationMessage({
        clientInboxId: currentSender.inboxId,
        conversationId: xmtpConversationId,
        content: {
          reply: {
            reference: content.reference,
            content: innerPayload,
          },
        },
      })
    } else {
      // Send as a regular message
      sentXmtpMessageId = await sendXmtpConversationMessage({
        clientInboxId: currentSender.inboxId,
        conversationId: xmtpConversationId,
        content: payload,
      })
    }

    if (!sentXmtpMessageId) {
      captureError(new Error(`Couldn't send message?`))
      continue // Skip if we couldn't send this message
    }

    const sentXmtpMessage = await getXmtpConversationMessage({
      messageId: sentXmtpMessageId,
      clientInboxId: currentSender.inboxId,
    })

    // Not supposed to happen but just in case
    if (!sentXmtpMessage) {
      captureError(new Error(`Couldn't get the full xmtp message after sending`))
      continue
    }

    results.sentXmtpMessageIds.push(sentXmtpMessageId)
    results.sentMessages.push(convertXmtpMessageToConvosMessage(sentXmtpMessage))
  }

  if (results.sentXmtpMessageIds.length === 0) {
    throw new Error("Couldn't send any messages")
  }

  return results
}

export function useSendMessage() {
  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (variables) => {
      const { xmtpConversationId, contents } = variables

      const currentSender = getCurrentSender()!

      const tmpXmtpMessageIds: IXmtpMessageId[] = []
      const optimisticMessages: IConversationMessage[] = []

      for (const content of contents) {
        const tmpXmtpMessageId = getRandomId() as IXmtpMessageId
        tmpXmtpMessageIds.push(tmpXmtpMessageId)

        // No need to do conditional assignment as both branches assign the same value
        const messageContent = content

        const optimisticMessage = getMessageWithType({
          baseMessage: {
            xmtpId: tmpXmtpMessageId, // Will be set once we send the message and replace with the real
            xmtpTopic: getXmtpConversationTopicFromXmtpId(xmtpConversationId),
            sentNs: getTodayNs(),
            status: "sending",
            xmtpConversationId,
            senderInboxId: currentSender.inboxId,
          },
          content: messageContent,
        })

        optimisticMessages.push(optimisticMessage)

        addMessageToConversationMessagesQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId,
          message: optimisticMessage,
        })
      }

      const previousConversation = getConversationQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
      })

      // Use the last optimistic message to update the conversation
      const lastOptimisticMessage = optimisticMessages[optimisticMessages.length - 1]
      if (lastOptimisticMessage) {
        updateConversationQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId,
          conversationUpdate: {
            lastMessage: lastOptimisticMessage,
          },
        })
      }

      return {
        tmpXmtpMessageIds,
        optimisticMessages,
        previousConversation,
      }
    },
    onSuccess: async (result, variables, context) => {
      const currentSender = getSafeCurrentSender()

      // Replace each optimistic message with the real one
      if (result.sentMessages && result.sentMessages.length > 0) {
        let hasError = false

        // Replace optimistic messages with real ones, up to the number of messages we have
        context.tmpXmtpMessageIds
          .slice(0, result.sentMessages.length)
          .forEach((tmpXmtpMessageId, index) => {
            try {
              replaceOptimisticMessageWithReal({
                tmpXmtpMessageId,
                xmtpConversationId: variables.xmtpConversationId,
                clientInboxId: currentSender.inboxId,
                realMessage: result.sentMessages[index],
              })
            } catch (error) {
              captureError(
                new GenericError({
                  error,
                  additionalMessage: "Error replacing optimistic message with real one",
                }),
              )
              hasError = true
            }
          })

        // If any replacement failed, invalidate the conversation messages query
        if (hasError) {
          invalidateConversationMessagesQuery({
            clientInboxId: currentSender.inboxId,
            xmtpConversationId: variables.xmtpConversationId,
          })
        }
      }
    },
    onError: (_, variables, context) => {
      if (!context) {
        return
      }

      const currentSender = getSafeCurrentSender()

      // Remove all optimistic messages
      for (const tmpMessageId of context.tmpXmtpMessageIds) {
        removeMessageToConversationMessagesQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: variables.xmtpConversationId,
          messageId: tmpMessageId,
        })
      }

      if (context.previousConversation) {
        // Revert last message of conversation and list
        updateConversationQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: variables.xmtpConversationId,
          conversationUpdate: {
            lastMessage: context.previousConversation?.lastMessage,
          },
        })
      }
    },
  })
}

function replaceOptimisticMessageWithReal(args: {
  tmpXmtpMessageId: IXmtpMessageId
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
  realMessage: IConversationMessage
}) {
  const { tmpXmtpMessageId, xmtpConversationId, clientInboxId, realMessage } = args

  const existingMessages = reactQueryClient.getQueryData(
    getConversationMessagesQueryOptions({
      clientInboxId,
      xmtpConversationId,
    }).queryKey,
  )

  if (!existingMessages) {
    return
  }

  // Find the index of the temporary message
  const tempOptimisticMessageIndex = existingMessages.ids.indexOf(tmpXmtpMessageId)

  if (tempOptimisticMessageIndex === -1) {
    throw new Error("[replaceOptimisticMessageWithReal] Temp message not found")
  }

  // Create new ids array with the real message id replacing the temp id
  const newIds = [...existingMessages.ids]
  newIds[tempOptimisticMessageIndex] = realMessage.xmtpId

  // Add new message first, then spread existing byId
  const newById: IMessageAccumulator["byId"] = {
    [realMessage.xmtpId]: updateObjectAndMethods(realMessage, {
      xmtpId: realMessage.xmtpId,
    }),
    ...existingMessages.byId,
  }
  // Remove the temporary message entry
  delete newById[tmpXmtpMessageId as IXmtpMessageId]

  const updatedState = {
    ...existingMessages,
    ids: newIds,
    byId: newById,
  }

  return reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({ clientInboxId, xmtpConversationId }).queryKey,
    updatedState,
  )
}
