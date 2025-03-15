import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken } from "@tanstack/react-query"
import { IConversation, IConversationTopic } from "@/features/conversation/conversation.types"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { setConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import logger from "@/utils/logger"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type IUnknownConversationsQuery = Awaited<ReturnType<typeof getUnknownConversations>>

async function getUnknownConversations(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  if (!inboxId) {
    throw new Error("InboxId is required")
  }

  await ensureConversationSyncAllQuery({
    clientInboxId: inboxId,
    consentStates: ["unknown"],
  })

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  const xmtpConversations = await client.conversations.list(
    {
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrl: true,
      consentState: true,
      lastMessage: true,
      description: true,
    },
    20, // For now we only fetch 20 until we have the right pagination system. At least people will be able to see their conversations
    ["unknown"],
  )

  const convosConversations = await Promise.all(
    xmtpConversations.map(convertXmtpConversationToConvosConversation),
  )

  // For now conversations have all the same properties as one conversation
  for (const conversation of convosConversations) {
    setConversationQueryData({
      clientInboxId: inboxId,
      topic: conversation.topic,
      conversation,
    })
  }

  return convosConversations
}

export const prefetchUnknownConsentConversationsQuery = (args: { inboxId: IXmtpInboxId }) => {
  return reactQueryClient.prefetchQuery(getUnknownConsentConversationsQueryOptions(args))
}

export const addConversationToUnknownConsentConversationsQuery = (args: {
  inboxId: IXmtpInboxId
  conversation: IConversation
}) => {
  const { inboxId, conversation } = args

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    inboxId,
  })

  if (!previousConversationsData) {
    reactQueryClient.setQueryData(
      getUnknownConsentConversationsQueryOptions({ inboxId }).queryKey,
      [conversation],
    )
    return
  }

  const conversationExists = previousConversationsData.some((c) => c.topic === conversation.topic)

  if (conversationExists) {
    return
  }

  reactQueryClient.setQueryData(getUnknownConsentConversationsQueryOptions({ inboxId }).queryKey, [
    conversation,
    ...previousConversationsData,
  ])
}

export const getUnknownConsentConversationsQueryData = (args: { inboxId: IXmtpInboxId }) => {
  return reactQueryClient.getQueryData(getUnknownConsentConversationsQueryOptions(args).queryKey)
}

export const updateConversationInUnknownConsentConversationsQueryData = (args: {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
  conversationUpdate: Partial<IConversation>
}) => {
  const { inboxId, topic, conversationUpdate } = args

  logger.debug(
    `[UnknownConversationsQuery] updateConversationInUnknownConsentConversationsQueryData for inboxId ${inboxId} and topic ${topic}`,
  )

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    inboxId,
  })
  if (!previousConversationsData) {
    return
  }
  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      return updateObjectAndMethods(c, conversationUpdate)
    }
    return c
  })

  reactQueryClient.setQueryData(
    getUnknownConsentConversationsQueryOptions({
      inboxId,
    }).queryKey,
    newConversations,
  )
}

export const removeConversationFromUnknownConsentConversationsQueryData = (args: {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
}) => {
  const { inboxId, topic } = args

  logger.debug(
    `[UnknownConversationsQuery] removeConversationFromUnknownConsentConversationsQueryData for inboxId ${inboxId} and topic ${topic}`,
  )

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    inboxId,
  })

  if (!previousConversationsData) {
    return
  }

  const newConversations = previousConversationsData.filter(
    (conversation) => conversation.topic !== topic,
  )

  reactQueryClient.setQueryData(
    getUnknownConsentConversationsQueryOptions({ inboxId }).queryKey,
    newConversations,
  )
}

export function getUnknownConsentConversationsQueryOptions(args: {
  inboxId: IXmtpInboxId
  caller?: string
}) {
  const { inboxId, caller } = args

  const enabled = !!inboxId

  return queryOptions({
    enabled,
    meta: {
      caller,
    },
    queryKey: ["unknown-consent-conversations", inboxId],
    queryFn: enabled
      ? async () =>
          getUnknownConversations({
            inboxId,
          })
      : skipToken,
  })
}
