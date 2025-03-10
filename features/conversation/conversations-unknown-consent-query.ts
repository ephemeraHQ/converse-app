import { queryOptions, skipToken } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { setConversationQueryData } from "@/features/conversation/conversation-query"
import { ensureConversationSyncAllQuery } from "@/features/conversation/conversation-sync-all-query"
import { getXmtpClientByEthAddress } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types"
import { unknownConsentConversationsQueryKey } from "@/queries/QueryKeys"
import logger from "@/utils/logger"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../utils/react-query/react-query.client"

export type IUnknownConversationsQuery = Awaited<ReturnType<typeof getUnknownConversations>>

async function getUnknownConversations(args: { account: string }) {
  const { account } = args

  if (!account) {
    throw new Error("Account is required")
  }

  await ensureConversationSyncAllQuery({
    ethAddress: account,
    consentStates: ["unknown"],
  })

  const client = await getXmtpClientByEthAddress({
    ethAddress: account,
  })

  const conversations = await client.conversations.list(
    {
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrlSquare: true,
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
      account,
      topic: conversation.topic,
      conversation,
    })
  }

  return conversations
}

export const prefetchUnknownConsentConversationsQuery = (args: { account: string }) => {
  return reactQueryClient.prefetchQuery(getUnknownConsentConversationsQueryOptions(args))
}

export const addConversationToUnknownConsentConversationsQuery = (args: {
  account: string
  conversation: IXmtpConversationWithCodecs
}) => {
  const { account, conversation } = args

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    account,
  })

  if (!previousConversationsData) {
    reactQueryClient.setQueryData<IUnknownConversationsQuery>(
      getUnknownConsentConversationsQueryOptions({ account }).queryKey,
      [conversation],
    )
    return
  }

  const conversationExists = previousConversationsData.some((c) => c.topic === conversation.topic)

  if (conversationExists) {
    return
  }

  reactQueryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({ account }).queryKey,
    [conversation, ...previousConversationsData],
  )
}

export const getUnknownConsentConversationsQueryData = (args: { account: string }) => {
  return reactQueryClient.getQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions(args).queryKey,
  )
}

export const updateConversationInUnknownConsentConversationsQueryData = (args: {
  account: string
  topic: ConversationTopic
  conversationUpdate: Partial<IXmtpConversationWithCodecs>
}) => {
  const { account, topic, conversationUpdate } = args

  logger.debug(
    `[UnknownConversationsQuery] updateConversationInUnknownConsentConversationsQueryData for account ${account} and topic ${topic}`,
  )

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    account,
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
      account,
    }).queryKey,
    newConversations,
  )
}

export const removeConversationFromUnknownConsentConversationsQueryData = (args: {
  account: string
  topic: ConversationTopic
}) => {
  const { account, topic } = args

  logger.debug(
    `[UnknownConversationsQuery] removeConversationFromUnknownConsentConversationsQueryData for account ${account} and topic ${topic}`,
  )

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    account,
  })

  if (!previousConversationsData) {
    return
  }

  const newConversations = previousConversationsData.filter(
    (conversation) => conversation.topic !== topic,
  )

  reactQueryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({ account }).queryKey,
    newConversations,
  )
}

export function getUnknownConsentConversationsQueryOptions(args: {
  account: string
  caller?: string
}) {
  const { account, caller } = args

  const enabled = !!account

  return queryOptions({
    enabled,
    meta: {
      caller,
    },
    queryKey: unknownConsentConversationsQueryKey(account),
    queryFn: enabled
      ? async () =>
          getUnknownConversations({
            account,
          })
      : skipToken,
    refetchOnMount: true, // Just for now to make sure we always have the lastest conversations
  })
}
