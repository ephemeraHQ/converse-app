import type { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { config } from "@/config"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { isTempConversation } from "@/features/conversation/utils/is-temp-conversation"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client"
import { Optional } from "@/types/general"
import { captureError } from "@/utils/capture-error"
import { updateObjectAndMethods } from "@/utils/update-object-and-methods"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type IConversationQueryData = Awaited<ReturnType<typeof getConversation>>

type IGetConversationArgs = {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}

type IGetConversationArgsWithCaller = IGetConversationArgs & { caller: string }

async function getConversation(args: IGetConversationArgs) {
  const { clientInboxId, xmtpConversationId } = args

  if (!xmtpConversationId) {
    throw new Error("Xmtp conversation ID is required")
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
  ).find((xmtpConversation) => xmtpConversation.id === xmtpConversationId)

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
      new Error(
        `[useConversationQuery] Fetched conversation for ${xmtpConversationId} in ${totalTimeDiff}ms`,
      ),
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
  const { clientInboxId, xmtpConversationId, caller } = args
  const enabled = !!xmtpConversationId && !!clientInboxId && !isTempConversation(xmtpConversationId)
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: ["conversation", clientInboxId, xmtpConversationId],
    queryFn: enabled ? () => getConversation({ clientInboxId, xmtpConversationId }) : skipToken,
    enabled,
  })
}

export const setConversationQueryData = (
  args: IGetConversationArgs & {
    conversation: IConversationQueryData
  },
) => {
  const { clientInboxId, xmtpConversationId, conversation } = args
  reactQueryClient.setQueryData(
    getConversationQueryOptions({
      clientInboxId,
      xmtpConversationId,
    }).queryKey,
    (previousConversation) => {
      if (!previousConversation) {
        return conversation
      }

      if (!conversation) {
        return null
      }

      // Keep existing lastMessage if new conversation has undefined lastMessage
      const lastMessage =
        conversation.lastMessage === undefined
          ? previousConversation.lastMessage
          : conversation.lastMessage

      return {
        ...previousConversation,
        ...conversation,
        lastMessage,
      }
    },
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

export function ensureConversationQueryData(args: IGetConversationArgsWithCaller) {
  return reactQueryClient.ensureQueryData(getConversationQueryOptions(args))
}

export function invalidateConversationQuery(args: IGetConversationArgs) {
  return reactQueryClient.invalidateQueries(getConversationQueryOptions(args))
}
