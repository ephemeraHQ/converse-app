import { IXmtpConversationTopic, IXmtpInboxId , IXmtpConversationWithCodecs } from "@features/xmtp/xmtp.types"
import { QueryObserver, queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import {
  getConversationQueryData,
  setConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { getXmtpConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { Optional } from "@/types/general"
import { captureError } from "@/utils/capture-error"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"
import { ensureGroupMembersQueryData } from "../../groups/useGroupMembersQuery"

export type IAllowedConsentConversationsQuery = Awaited<
  ReturnType<typeof getAllowedConsentConversations>
>

type IArgs = {
  inboxId: IXmtpInboxId
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
    conversation: IXmtpConversationWithCodecs
  },
) {
  const { inboxId, conversation } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    inboxId,
  })

  if (!previousConversationsData) {
    reactQueryClient.setQueryData(
      getAllowedConsentConversationsQueryOptions({ inboxId }).queryKey,
      [conversation],
    )
    return
  }

  const conversationExists = previousConversationsData.some((c) => c.topic === conversation.topic)

  if (conversationExists) {
    return updateConversationInAllowedConsentConversationsQueryData({
      inboxId,
      topic: conversation.topic,
      conversationUpdate: conversation,
    })
  }

  reactQueryClient.setQueryData<IAllowedConsentConversationsQuery>(
    getAllowedConsentConversationsQueryOptions({ inboxId }).queryKey,
    [conversation, ...previousConversationsData],
  )
}

export const removeConversationFromAllowedConsentConversationsQuery = (
  args: IArgs & {
    topic: IXmtpConversationTopic
  },
) => {
  const { inboxId, topic } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    inboxId,
  })

  if (!previousConversationsData) {
    return
  }

  reactQueryClient.setQueryData(
    getAllowedConsentConversationsQueryOptions({ inboxId }).queryKey,
    previousConversationsData.filter((c) => c.topic !== topic),
  )
}

export const getAllowedConsentConversationsQueryData = (args: IArgs) => {
  return reactQueryClient.getQueryData(getAllowedConsentConversationsQueryOptions(args).queryKey)
}

const getAllowedConsentConversations = async (args: IArgs) => {
  const { inboxId } = args

  await ensureConversationSyncAllQuery({
    clientInboxId: inboxId,
    consentStates: ["allowed"],
  })

  const conversations = await getXmtpConversations({
    clientInboxId: inboxId,
    consentStates: ["allowed"],
  })

  for (const conversation of conversations) {
    // Only set if the conversation is not already in the query cache
    // Because otherwise we might put a outdated conversation in the query cache.
    if (!getConversationQueryData({ inboxId, topic: conversation.topic })) {
      setConversationQueryData({
        inboxId,
        topic: conversation.topic,
        conversation,
      })
    }

    // We are often using conversation members info
    // Call after setting the conversation because we'll need the conversation to get the members
    ensureGroupMembersQueryData({
      caller: "getAllowedConsentConversations",
      clientInboxId: inboxId,
      topic: conversation.topic,
    }).catch(captureError)
  }

  return conversations
}

export const getAllowedConsentConversationsQueryOptions = (
  args: Optional<IArgsWithCaller, "caller">,
) => {
  const { inboxId, caller } = args
  const enabled = !!inboxId
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: ["allowed-consent-conversations", inboxId],
    queryFn: enabled ? () => getAllowedConsentConversations({ inboxId }) : skipToken,
    enabled,
  })
}

export const updateConversationInAllowedConsentConversationsQueryData = (
  args: IArgs & {
    topic: IXmtpConversationTopic
    conversationUpdate: Partial<IXmtpConversationWithCodecs>
  },
) => {
  const { inboxId, topic, conversationUpdate } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    inboxId,
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
      inboxId,
    }).queryKey,
    newConversations,
  )
}

export function fetchAllowedConsentConversationsQuery(args: IArgsWithCaller) {
  return reactQueryClient.fetchQuery(getAllowedConsentConversationsQueryOptions(args))
}
