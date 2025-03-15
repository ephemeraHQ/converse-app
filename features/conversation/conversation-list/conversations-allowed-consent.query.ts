import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { QueryObserver, queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { IConversation, IConversationTopic } from "@/features/conversation/conversation.types"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import {
  getConversationQueryData,
  setConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { getXmtpConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { Optional } from "@/types/general"
import { captureError } from "@/utils/capture-error"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type IAllowedConsentConversationsQuery = Awaited<
  ReturnType<typeof getAllowedConsentConversations>
>

type IArgs = {
  clientInboxId: IXmtpInboxId
}

type IArgsWithCaller = IArgs & { caller: string }

export const createAllowedConsentConversationsQueryObserver = (
  args: IArgs & { caller: string },
) => {
  return new QueryObserver(reactQueryClient, getAllowedConsentConversationsQueryOptions(args))
}

export const useAllowedConsentConversationsQuery = (args: IArgs & { caller: string }) => {
  return useQuery(getAllowedConsentConversationsQueryOptions(args))
}

export function addConversationToAllowedConsentConversationsQuery(
  args: IArgs & {
    conversation: IConversation
  },
) {
  const { clientInboxId: inboxId, conversation } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    clientInboxId: inboxId,
  })

  if (!previousConversationsData) {
    reactQueryClient.setQueryData(
      getAllowedConsentConversationsQueryOptions({ clientInboxId: inboxId }).queryKey,
      [conversation],
    )
    return
  }

  const conversationExists = previousConversationsData.some((c) => c.topic === conversation.topic)

  if (conversationExists) {
    return updateConversationInAllowedConsentConversationsQueryData({
      clientInboxId: inboxId,
      topic: conversation.topic,
      conversationUpdate: conversation,
    })
  }

  reactQueryClient.setQueryData<IAllowedConsentConversationsQuery>(
    getAllowedConsentConversationsQueryOptions({ clientInboxId: inboxId }).queryKey,
    [conversation, ...previousConversationsData],
  )
}

export const removeConversationFromAllowedConsentConversationsQuery = (
  args: IArgs & {
    topic: IConversationTopic
  },
) => {
  const { clientInboxId: inboxId, topic } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    clientInboxId: inboxId,
  })

  if (!previousConversationsData) {
    return
  }

  reactQueryClient.setQueryData(
    getAllowedConsentConversationsQueryOptions({ clientInboxId: inboxId }).queryKey,
    previousConversationsData.filter((c) => c.topic !== topic),
  )
}

export const getAllowedConsentConversationsQueryData = (args: IArgs) => {
  return reactQueryClient.getQueryData(getAllowedConsentConversationsQueryOptions(args).queryKey)
}

const getAllowedConsentConversations = async (args: IArgs) => {
  const { clientInboxId: inboxId } = args

  await ensureConversationSyncAllQuery({
    clientInboxId: inboxId,
    consentStates: ["allowed"],
  })

  const conversations = await getXmtpConversations({
    clientInboxId: inboxId,
    consentStates: ["allowed"],
  })

  const convosConversations = await Promise.all(
    conversations.map(convertXmtpConversationToConvosConversation),
  )

  for (const convoConversation of convosConversations) {
    // Only set if the conversation is not already in the query cache
    // Because otherwise we might put a outdated conversation in the query cache.
    if (!getConversationQueryData({ clientInboxId: inboxId, topic: convoConversation.topic })) {
      setConversationQueryData({
        clientInboxId: inboxId,
        topic: convoConversation.topic,
        conversation: convoConversation,
      })
    }
  }

  return convosConversations
}

export const getAllowedConsentConversationsQueryOptions = (
  args: Optional<IArgsWithCaller, "caller">,
) => {
  const { clientInboxId: inboxId, caller } = args
  const enabled = !!inboxId
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: ["allowed-consent-conversations", inboxId],
    queryFn: enabled ? () => getAllowedConsentConversations({ clientInboxId: inboxId }) : skipToken,
    enabled,
  })
}

export const updateConversationInAllowedConsentConversationsQueryData = (
  args: IArgs & {
    topic: IConversationTopic
    conversationUpdate: Partial<IConversation>
  },
) => {
  const { clientInboxId: inboxId, topic, conversationUpdate } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    clientInboxId: inboxId,
  })

  if (!previousConversationsData) {
    captureError(
      new Error(
        `No previous conversations data found for account: ${inboxId} when updating conversation in allowed consent conversations query data: ${JSON.stringify(
          conversationUpdate,
        )}`,
      ),
    )
    return
  }

  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      return updateObjectAndMethods(c, conversationUpdate)
    }
    return c
  })

  reactQueryClient.setQueryData<IAllowedConsentConversationsQuery>(
    getAllowedConsentConversationsQueryOptions({
      clientInboxId: inboxId,
    }).queryKey,
    newConversations,
  )
}

export function fetchAllowedConsentConversationsQuery(args: IArgsWithCaller) {
  return reactQueryClient.fetchQuery(getAllowedConsentConversationsQueryOptions(args))
}

export function invalidateAllowedConsentConversationsQuery(args: IArgs) {
  return reactQueryClient.invalidateQueries(getAllowedConsentConversationsQueryOptions(args))
}
