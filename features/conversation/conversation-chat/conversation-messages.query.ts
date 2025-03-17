import { queryOptions, useQuery } from "@tanstack/react-query"
import { logger } from "@utils/logger"
import { isReactionMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { isTempConversation } from "@/features/conversation/utils/is-temp-conversation"
import { syncXmtpConversation } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-sync"
import {
  getXmtpConversationMessages,
  isSupportedMessage,
} from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { IXmtpConversationId, IXmtpInboxId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getReactQueryKey } from "@/utils/react-query/react-query.utils"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import {
  ensureConversationQueryData,
  getConversationQueryData,
} from "../queries/conversation.query"
import {
  IConversationMessage,
  IConversationMessageReactionContent,
} from "./conversation-message/conversation-message.types"
import { convertXmtpMessageToConvosMessage } from "./conversation-message/utils/convert-xmtp-message-to-convos-message"

export type ConversationMessagesQueryData = Awaited<ReturnType<typeof conversationMessagesQueryFn>>

const conversationMessagesQueryFn = async (args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) => {
  const { clientInboxId, xmtpConversationId } = args

  if (!clientInboxId) {
    throw new Error("clientInboxId is required")
  }

  if (!xmtpConversationId) {
    throw new Error("xmtpConversationId is required")
  }

  const conversation = await ensureConversationQueryData({
    clientInboxId,
    xmtpConversationId,
    caller: "conversationMessagesQueryFn",
  })

  if (!conversation) {
    throw new Error("Conversation not found")
  }

  await syncXmtpConversation({
    clientInboxId,
    conversationId: conversation.xmtpId,
  })

  const xmtpMessages = await getXmtpConversationMessages({
    clientInboxId,
    conversationId: conversation.xmtpId,
    limit: 30, // Fetch limited messages for better performance until pagination is implemented
  })

  const validMessages = xmtpMessages.filter(isSupportedMessage)

  const convosMessages = validMessages.map(convertXmtpMessageToConvosMessage)

  return processMessages({ newMessages: convosMessages })
}

export const useConversationMessagesQuery = (args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  caller: string
}) => {
  return useQuery({
    ...getConversationMessagesQueryOptions(args),
  })
}

export const getConversationMessagesQueryData = (args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) => {
  return reactQueryClient.getQueryData(getConversationMessagesQueryOptions(args).queryKey)
}

export function refetchConversationMessages(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  caller: string
}) {
  logger.debug("[refetchConversationMessages] refetching messages")
  return reactQueryClient.refetchQueries({
    queryKey: getConversationMessagesQueryOptions(args).queryKey,
  })
}

export const addMessageToConversationMessagesQuery = (args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  message: IConversationMessage
}) => {
  const { clientInboxId, xmtpConversationId, message } = args

  const existingData = reactQueryClient.getQueryData(
    getConversationMessagesQueryOptions({
      clientInboxId,
      xmtpConversationId,
    }).queryKey,
  )

  if (!existingData) {
    return
  }

  const updatedData = processMessages({
    newMessages: [message],
    existingData,
  })

  return reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({
      clientInboxId,
      xmtpConversationId,
    }).queryKey,
    updatedData,
  )
}

export function removeMessageToConversationMessages(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  messageId: IXmtpMessageId
}) {
  const { clientInboxId, xmtpConversationId, messageId } = args

  const existingData = reactQueryClient.getQueryData(
    getConversationMessagesQueryOptions({
      clientInboxId,
      xmtpConversationId,
    }).queryKey,
  )

  if (!existingData) {
    return
  }

  const updatedIds = existingData.ids.filter((id) => id !== messageId)
  const updatedById = { ...existingData.byId }
  delete updatedById[messageId]

  const updatedReactions = { ...existingData.reactions }
  delete updatedReactions[messageId]

  const updatedData: IMessageAccumulator = {
    ids: updatedIds,
    byId: updatedById,
    reactions: updatedReactions,
  }

  return reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({
      clientInboxId,
      xmtpConversationId,
    }).queryKey,
    updatedData,
  )
}

export const prefetchConversationMessages = async (args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  caller: string
}) => {
  return reactQueryClient.prefetchQuery(getConversationMessagesQueryOptions(args))
}

export function getConversationMessagesQueryOptions(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  caller?: string // Optional because we don't want functions that just get or set query data to have to pass caller
}) {
  const { clientInboxId, xmtpConversationId, caller } = args
  const conversation = getConversationQueryData({
    clientInboxId,
    xmtpConversationId,
  })
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getReactQueryKey({
      baseStr: "conversation-messages",
      clientInboxId,
      xmtpConversationId,
    }),
    queryFn: () =>
      conversationMessagesQueryFn({
        clientInboxId,
        xmtpConversationId,
      }),
    enabled: !!conversation && !isTempConversation(xmtpConversationId),
  })
}

export type IMessageAccumulator = {
  ids: IXmtpMessageId[]
  byId: Record<IXmtpMessageId, IConversationMessage>
  reactions: Record<
    IXmtpMessageId,
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
      const messageId = regularMessage.xmtpId

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
  tmpId: IXmtpMessageId
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
  realMessage: IConversationMessage
}) {
  const { tmpId, xmtpConversationId, clientInboxId, realMessage } = args

  logger.debug("[linkOptimisticMessageToReal] linking optimistic message to real", {
    tempId: tmpId,
    messageId: realMessage.xmtpId,
  })

  const existingData = reactQueryClient.getQueryData(
    getConversationMessagesQueryOptions({
      clientInboxId,
      xmtpConversationId,
    }).queryKey,
  )

  if (!existingData) {
    return
  }

  logger.debug("[replaceOptimisticMessageWithReal] Processing message update", {
    previousMessagesExists: !!existingData,
    realMessageId: realMessage.xmtpId,
    tempId: tmpId,
  })

  if (!existingData) {
    const newState = {
      ids: [realMessage.xmtpId],
      byId: {
        [realMessage.xmtpId]: realMessage,
      },
      reactions: {},
    } satisfies IMessageAccumulator

    logger.debug("[replaceOptimisticMessageWithReal] No previous messages, creating new state", {
      newState: JSON.stringify(newState, null, 2),
    })

    return
  }

  // Find the index of the temporary message
  const tmpIndex = existingData.ids.indexOf(tmpId)

  logger.debug("[replaceOptimisticMessageWithReal] Found temp message index", {
    tempIndex: tmpIndex,
    messageIds: existingData.ids,
  })

  if (tmpIndex === -1) {
    logger.debug(
      "[replaceOptimisticMessageWithReal] Temp message not found, returning previous state",
    )
    return
  }

  // Create new ids array with the real message id replacing the temp id
  const newIds = [...existingData.ids]
  newIds[tmpIndex] = realMessage.xmtpId

  // Add new message first, then spread existing byId
  const newById: IMessageAccumulator["byId"] = {
    [realMessage.xmtpId]: updateObjectAndMethods(realMessage, {
      tempOptimisticId: tmpId,
    }),
    ...existingData.byId,
  }
  // Remove the temporary message entry
  delete newById[tmpId]

  const updatedState = {
    ...existingData,
    ids: newIds,
    byId: newById,
  }

  return reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({ clientInboxId, xmtpConversationId }).queryKey,
    updatedState,
  )
}

export function setConversationMessagesQueryData(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  data: IMessageAccumulator
}) {
  const { clientInboxId, xmtpConversationId, data } = args
  return reactQueryClient.setQueryData(
    getConversationMessagesQueryOptions({ clientInboxId, xmtpConversationId }).queryKey,
    data,
  )
}

export function invalidateConversationMessagesQuery(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) {
  const { clientInboxId, xmtpConversationId } = args
  return reactQueryClient.invalidateQueries(
    getConversationMessagesQueryOptions({ clientInboxId, xmtpConversationId }),
  )
}
