import { queryOptions, useQuery } from "@tanstack/react-query"
import { logger } from "@utils/logger"
import { isReactionMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { isTempConversation } from "@/features/conversation/utils/is-temp-conversation"
import { syncXmtpConversation } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-sync"
import {
  getXmtpConversationMessages,
  isSupportedMessage,
} from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { getQueryKey } from "@/utils/react-query/react-query.utils"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"
import { IConversationTopic } from "../conversation.types"
import {
  getConversationQueryData,
  getOrFetchConversationQuery,
} from "../queries/conversation.query"
import {
  IConversationMessage,
  IConversationMessageId,
  IConversationMessageReactionContent,
} from "./conversation-message/conversation-message.types"
import { convertXmtpMessageToConvosMessage } from "./conversation-message/utils/convert-xmtp-message-to-convos-message"

export type ConversationMessagesQueryData = Awaited<ReturnType<typeof conversationMessagesQueryFn>>

const conversationMessagesQueryFn = async (args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) => {
  const { clientInboxId, topic } = args

  if (!clientInboxId) {
    throw new Error("clientInboxId is required")
  }

  if (!topic) {
    throw new Error("topic is required")
  }

  const conversation = await getOrFetchConversationQuery({
    clientInboxId,
    topic,
    caller: "conversationMessagesQueryFn",
  })

  if (!conversation) {
    throw new Error("Conversation not found")
  }

  await syncXmtpConversation({
    clientInboxId,
    conversationId: conversation.id as unknown as IXmtpConversationId,
  })

  const xmtpMessages = await getXmtpConversationMessages({
    clientInboxId,
    conversationId: conversation.id as unknown as IXmtpConversationId,
    limit: 30, // Fetch limited messages for better performance until pagination is implemented
  })

  const validMessages = xmtpMessages.filter(isSupportedMessage)

  const convosMessages = validMessages.map(convertXmtpMessageToConvosMessage)

  return processMessages({ newMessages: convosMessages })
}

export const useConversationMessagesQuery = (args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  caller: string
}) => {
  return useQuery(getConversationMessagesQueryOptions(args))
}

export const getConversationMessagesQueryData = (args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) => {
  return reactQueryClient.getQueryData(getConversationMessagesQueryOptions(args).queryKey)
}

export function refetchConversationMessages(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  caller: string
}) {
  logger.debug("[refetchConversationMessages] refetching messages")
  return reactQueryClient.refetchQueries(getConversationMessagesQueryOptions(args))
}

export const addMessageToConversationMessagesQuery = (args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  message: IConversationMessage
}) => {
  const { clientInboxId, topic, message } = args

  reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({ clientInboxId, topic }).queryKey,
    (previousMessages) => {
      return processMessages({
        newMessages: [message],
        existingData: previousMessages,
        prependNewMessages: true,
      })
    },
  )
}

export function removeMessageToConversationMessages(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  messageId: IConversationMessageId
}) {
  const { clientInboxId, topic, messageId } = args

  reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({ clientInboxId, topic }).queryKey,
    (previousMessages) => {
      if (!previousMessages) {
        return undefined
      }
      const newById = {
        ...previousMessages.byId,
      }
      delete newById[messageId]
      return {
        ...previousMessages,
        byId: newById,
        ids: previousMessages?.ids.filter((id) => id !== messageId),
      }
    },
  )
}

export const prefetchConversationMessages = async (args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  caller: string
}) => {
  return reactQueryClient.prefetchQuery(getConversationMessagesQueryOptions(args))
}

export function getConversationMessagesQueryOptions(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  caller?: string // Optional because we don't want functions that just get or set query data to have to pass caller
}) {
  const { clientInboxId, topic, caller } = args
  const conversation = getConversationQueryData({
    clientInboxId,
    topic,
  })
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getQueryKey({
      baseStr: "conversation-messages",
      clientInboxId,
      topic,
    }),
    queryFn: () => conversationMessagesQueryFn({ clientInboxId, topic }),
    enabled: !!conversation && !isTempConversation(topic),
  })
}

export type IMessageAccumulator = {
  ids: IConversationMessageId[]
  byId: Record<IConversationMessageId, IConversationMessage>
  reactions: Record<
    IConversationMessageId,
    {
      bySender: Record<IXmtpInboxId, IConversationMessageReactionContent[]>
      byReactionContent: Record<string, IXmtpInboxId[]>
    }
  >
}

function processMessages(args: {
  newMessages: IConversationMessage[]
  existingData?: IMessageAccumulator
  prependNewMessages?: boolean
}): IMessageAccumulator {
  const { newMessages, existingData, prependNewMessages = false } = args

  const result: IMessageAccumulator = existingData
    ? { ...existingData }
    : {
        ids: [],
        byId: {},
        reactions: {},
      }

  for (const message of newMessages) {
    if (!isReactionMessage(message)) {
      // After isReactionMessage check, we know this is a regular message
      const regularMessage = message
      const messageId = regularMessage.id

      if (result.byId[messageId]) {
        result.byId[messageId] = regularMessage
        continue
      }

      if (prependNewMessages) {
        result.byId = { [messageId]: regularMessage, ...result.byId }
        result.ids = [messageId, ...result.ids]
      } else {
        result.byId[messageId] = regularMessage
        result.ids.push(messageId)
      }
    }
  }

  const reactionsMessages = newMessages.filter(isReactionMessage)
  const processedReactions = new Set<string>()

  for (const reactionMessage of reactionsMessages) {
    const reactionContent = reactionMessage.content
    const referenceMessageId = reactionContent?.reference
    const senderAddress = reactionMessage.senderInboxId

    if (!reactionContent || !referenceMessageId) {
      continue
    }

    const reactionKey = `${reactionContent.content}-${referenceMessageId}`

    if (processedReactions.has(reactionKey)) {
      continue
    }

    processedReactions.add(reactionKey)

    if (!result.reactions[referenceMessageId]) {
      result.reactions[referenceMessageId] = {
        bySender: {},
        byReactionContent: {},
      }
    }

    const messageReactions = result.reactions[referenceMessageId]

    if (reactionContent.action === "added") {
      const hasExistingReaction = messageReactions.bySender[senderAddress]?.some(
        (reaction: IConversationMessageReactionContent) =>
          reaction.content === reactionContent.content,
      )

      if (!hasExistingReaction) {
        messageReactions.byReactionContent[reactionContent.content] = [
          ...(messageReactions.byReactionContent[reactionContent.content] || []),
          senderAddress,
        ]
        messageReactions.bySender[senderAddress] = [
          ...(messageReactions.bySender[senderAddress] || []),
          reactionContent,
        ]
      }
    } else if (reactionContent.action === "removed") {
      messageReactions.byReactionContent[reactionContent.content] = (
        messageReactions.byReactionContent[reactionContent.content] || []
      ).filter((id) => id !== senderAddress)
      messageReactions.bySender[senderAddress] = (
        messageReactions.bySender[senderAddress] || []
      ).filter(
        (reaction: IConversationMessageReactionContent) =>
          reaction.content !== reactionContent.content,
      )
    }
  }

  return result
}

export function replaceOptimisticMessageWithReal(args: {
  tempId: IConversationMessageId
  topic: IConversationTopic
  clientInboxId: IXmtpInboxId
  realMessage: IConversationMessage
}) {
  const { tempId, topic, clientInboxId, realMessage } = args
  logger.debug("[linkOptimisticMessageToReal] linking optimistic message to real", {
    tempId,
    messageId: realMessage.id,
  })

  reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({ clientInboxId, topic }).queryKey,
    (previousMessages) => {
      logger.debug("[replaceOptimisticMessageWithReal] Processing message update", {
        previousMessagesExists: !!previousMessages,
        realMessageId: realMessage.id,
        tempId,
      })

      if (!previousMessages) {
        const newState = {
          ids: [realMessage.id],
          byId: {
            [realMessage.id]: realMessage,
          },
          reactions: {},
        } satisfies IMessageAccumulator

        logger.debug(
          "[replaceOptimisticMessageWithReal] No previous messages, creating new state",
          {
            newState: JSON.stringify(newState, null, 2),
          },
        )

        return newState
      }

      // Find the index of the temporary message
      const tempIndex = previousMessages.ids.indexOf(tempId)

      logger.debug("[replaceOptimisticMessageWithReal] Found temp message index", {
        tempIndex,
        messageIds: previousMessages.ids,
      })

      if (tempIndex === -1) {
        logger.debug(
          "[replaceOptimisticMessageWithReal] Temp message not found, returning previous state",
        )
        return previousMessages
      }

      // Create new ids array with the real message id replacing the temp id
      const newIds = [...previousMessages.ids]
      newIds[tempIndex] = realMessage.id

      // Add new message first, then spread existing byId
      const newById: IMessageAccumulator["byId"] = {
        [realMessage.id]: updateObjectAndMethods(realMessage, {
          // @ts-expect-error
          tempOptimisticId: tempId,
        }),
        ...previousMessages.byId,
      }
      // Remove the temporary message entry
      delete newById[tempId]

      const updatedState = {
        ...previousMessages,
        ids: newIds,
        byId: newById,
      }

      return updatedState
    },
  )
}

export function setConversationMessagesQueryData(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
  data: IMessageAccumulator
}) {
  const { clientInboxId, topic, data } = args
  return reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({ clientInboxId, topic }).queryKey,
    data,
  )
}

export function invalidateConversationMessagesQuery(args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) {
  return reactQueryClient.invalidateQueries(getConversationMessagesQueryOptions(args))
}
