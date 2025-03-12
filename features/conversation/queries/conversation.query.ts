import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import type { ConversationTopic, InboxId } from "@xmtp/react-native-sdk"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { Optional } from "@/types/general"
import { captureError } from "@/utils/capture-error"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { conversationQueryKey } from "../../../queries/QueryKeys"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type ConversationQueryData = Awaited<ReturnType<typeof getConversation>>

type IGetConversationArgs = {
  inboxId: InboxId
  topic: ConversationTopic
}

type IGetConversationArgsWithCaller = IGetConversationArgs & { caller: string }

async function getConversation(args: IGetConversationArgs) {
  const { inboxId: inboxId, topic } = args

  if (!topic) {
    throw new Error("Topic is required")
  }

  if (!inboxId) {
    throw new Error("Inbox ID is required")
  }

  const totalStart = new Date().getTime()

  /**
   * (START) TMP until we can fetch a single conversation and get ALL the properties for it (lastMessage, etc)
   */
  await Promise.all([
    ensureConversationSyncAllQuery({
      clientInboxId: inboxId,
      consentStates: ["allowed"],
    }),
    ensureConversationSyncAllQuery({
      clientInboxId: inboxId,
      consentStates: ["unknown"],
    }),
    ensureConversationSyncAllQuery({
      clientInboxId: inboxId,
      consentStates: ["denied"],
    }),
  ])

  const client = await getXmtpClientByInboxId({
    inboxId,
  })

  const conversation = (
    await client.conversations.list({
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrl: true,
      consentState: true,
      lastMessage: true,
      description: true,
    })
  ).find((c) => c.topic === topic)

  if (!conversation) {
    throw new Error(`Conversation ${topic} not found`)
  }
  /**
   * (END) TMP until we can fetch a single conversation and get ALL the properties for it (lastMessage, etc)
   */

  // Try to find conversation in local DB first
  // let conversation = await client.conversations.findConversationByTopic(topic);

  // If not found locally, sync and try again
  // if (!conversation) {
  //   logger.warn(
  //     `[useConversationQuery] Conversation not found in local DB, syncing conversations`
  //   );

  //   await client.conversations.sync();
  //   conversation = await client.conversations.findConversationByTopic(topic);

  //   if (!conversation) {
  //     // Throwing here because if we have a topic, we should have a conversation
  //     throw new Error(`Conversation ${topic} not found`);
  //   }
  // }

  // await conversation.sync();

  const totalEnd = new Date().getTime()
  const totalTimeDiff = totalEnd - totalStart

  if (totalTimeDiff > 3000) {
    captureError(
      new Error(`[useConversationQuery] Fetched conversation for ${topic} in ${totalTimeDiff}ms`),
    )
  }

  return conversation
}

export const useConversationQuery = (args: IGetConversationArgsWithCaller) => {
  return useQuery(getConversationQueryOptions(args))
}

export function getConversationQueryOptions(
  args: Optional<IGetConversationArgsWithCaller, "caller">,
) {
  const { inboxId: inboxId, topic, caller } = args
  const enabled = !!topic && !!inboxId
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: conversationQueryKey(inboxId, topic),
    queryFn: enabled ? () => getConversation({ inboxId: inboxId, topic }) : skipToken,
    enabled,
  })
}

export const setConversationQueryData = (
  args: IGetConversationArgs & {
    conversation: ConversationQueryData
  },
) => {
  const { inboxId: inboxId, topic, conversation } = args
  reactQueryClient.setQueryData(
    getConversationQueryOptions({
      inboxId: inboxId,
      topic,
    }).queryKey,
    conversation,
  )
}

export function updateConversationQueryData(
  args: IGetConversationArgs & {
    conversationUpdate: Partial<ConversationQueryData>
  },
) {
  const { conversationUpdate } = args
  reactQueryClient.setQueryData(
    getConversationQueryOptions(args).queryKey,
    (previousConversation) => {
      if (!previousConversation) {
        return undefined
      }
      return updateObjectAndMethods(previousConversation, conversationUpdate)
    },
  )
}

export const getConversationQueryData = (args: IGetConversationArgs) => {
  return reactQueryClient.getQueryData(getConversationQueryOptions(args).queryKey)
}

export function getOrFetchConversationQuery(args: IGetConversationArgsWithCaller) {
  return reactQueryClient.ensureQueryData(getConversationQueryOptions(args))
}
