import { queryOptions, skipToken } from "@tanstack/react-query"
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { setConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types"
import { unknownConsentConversationsQueryKey } from "@/queries/QueryKeys"
import logger from "@/utils/logger"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type IUnknownConversationsQuery = Awaited<ReturnType<typeof getUnknownConversations>>

async function getUnknownConversations(args: { inboxId: InboxId }) {
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

  const conversations = await client.conversations.list(
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

  // For now conversations have all the same properties as one conversation
  for (const conversation of conversations) {
    setConversationQueryData({
      inboxId,
      topic: conversation.topic,
      conversation,
    })
  }

  return conversations
}

export const prefetchUnknownConsentConversationsQuery = (args: { inboxId: InboxId }) => {
  return reactQueryClient.prefetchQuery(getUnknownConsentConversationsQueryOptions(args))
}

export const addConversationToUnknownConsentConversationsQuery = (args: {
  inboxId: InboxId
  conversation: IXmtpConversationWithCodecs
}) => {
  const { inboxId, conversation } = args

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    inboxId,
  })

  if (!previousConversationsData) {
    reactQueryClient.setQueryData<IUnknownConversationsQuery>(
      getUnknownConsentConversationsQueryOptions({ inboxId }).queryKey,
      [conversation],
    )
    return
  }

  const conversationExists = previousConversationsData.some((c) => c.topic === conversation.topic)

  if (conversationExists) {
    return
  }

  reactQueryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({ inboxId }).queryKey,
    [conversation, ...previousConversationsData],
  )
}

export const getUnknownConsentConversationsQueryData = (args: { inboxId: InboxId }) => {
  return reactQueryClient.getQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions(args).queryKey,
  )
}

export const updateConversationInUnknownConsentConversationsQueryData = (args: {
  inboxId: InboxId
  topic: ConversationTopic
  conversationUpdate: Partial<IXmtpConversationWithCodecs>
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

  reactQueryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({
      inboxId,
    }).queryKey,
    newConversations,
  )
}

export const removeConversationFromUnknownConsentConversationsQueryData = (args: {
  inboxId: InboxId
  topic: ConversationTopic
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

  reactQueryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({ inboxId }).queryKey,
    newConversations,
  )
}

export function getUnknownConsentConversationsQueryOptions(args: {
  inboxId: InboxId
  caller?: string
}) {
  const { inboxId, caller } = args

  const enabled = !!inboxId

  return queryOptions({
    enabled,
    meta: {
      caller,
    },
    queryKey: unknownConsentConversationsQueryKey(inboxId),
    queryFn: enabled
      ? async () =>
          getUnknownConversations({
            inboxId,
          })
      : skipToken,
  })
}
