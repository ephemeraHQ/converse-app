import type { IXmtpConversationTopic, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { config } from "@/config"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { Optional } from "@/types/general"
import { captureError } from "@/utils/capture-error"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"
import type { IConversationTopic } from "../conversation.types"

export type IConversationQueryData = Awaited<ReturnType<typeof getConversation>>

type IGetConversationArgs = {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}

type IGetConversationArgsWithCaller = IGetConversationArgs & { caller: string }

async function getConversation(args: IGetConversationArgs) {
  const { clientInboxId, topic } = args

  if (!topic) {
    throw new Error("Topic is required")
  }

  if (!clientInboxId) {
    throw new Error("Inbox ID is required")
  }

  const totalStart = new Date().getTime()

  /**
   * (START) TMP until we can fetch a single conversation and get ALL the properties for it (lastMessage, etc)
   */
  await Promise.all([
    ensureConversationSyncAllQuery({
      clientInboxId,
      consentStates: ["allowed"],
    }),
    ensureConversationSyncAllQuery({
      clientInboxId,
      consentStates: ["unknown"],
    }),
    ensureConversationSyncAllQuery({
      clientInboxId,
      consentStates: ["denied"],
    }),
  ])

  const client = await getXmtpClientByInboxId({
    inboxId: clientInboxId,
  })

  const xmtpConversations = (
    await client.conversations.list({
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrl: true,
      consentState: true,
      lastMessage: true,
      description: true,
    })
  ).find((c) => c.topic === (topic as unknown as IXmtpConversationTopic))

  if (!xmtpConversations) {
    return null
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

  if (totalTimeDiff > config.xmtp.maxMsUntilLogError) {
    captureError(
      new Error(`[useConversationQuery] Fetched conversation for ${topic} in ${totalTimeDiff}ms`),
    )
  }

  const convosConversation = await convertXmtpConversationToConvosConversation(xmtpConversations)

  return convosConversation
}

export const useConversationQuery = (args: IGetConversationArgsWithCaller) => {
  return useQuery(getConversationQueryOptions(args))
}

export function getConversationQueryOptions(
  args: Optional<IGetConversationArgsWithCaller, "caller">,
) {
  const { clientInboxId, topic, caller } = args
  const enabled = !!topic && !!clientInboxId
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: ["conversation", clientInboxId, topic],
    queryFn: enabled ? () => getConversation({ clientInboxId, topic }) : skipToken,
    enabled,
  })
}

export const setConversationQueryData = (
  args: IGetConversationArgs & {
    conversation: IConversationQueryData
  },
) => {
  const { clientInboxId, topic, conversation } = args
  reactQueryClient.setQueryData(
    getConversationQueryOptions({
      clientInboxId,
      topic,
    }).queryKey,
    conversation,
  )
}

export function updateConversationQueryData(
  args: IGetConversationArgs & {
    conversationUpdate: Partial<IConversationQueryData>
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

export function invalidateConversationQuery(args: IGetConversationArgs) {
  return reactQueryClient.invalidateQueries(getConversationQueryOptions(args))
}
