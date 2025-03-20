import type { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { config } from "@/config"
import { refetchConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { isTempConversation } from "@/features/conversation/utils/is-temp-conversation"
import { getXmtpConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-list"
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

  /**
   * This doesn't really work. It's slow
   */
  // await syncXmtpConversation({
  //   clientInboxId,
  //   conversationId: xmtpConversationId,
  // })
  // const xmtpConversation = await getXmtpConversation({
  //   clientInboxId,
  //   conversationId: xmtpConversationId,
  // })
  // if (!xmtpConversation) {
  //   throw new Error("XMTP Conversation not found")
  // }
  // const convosConversation = await convertXmtpConversationToConvosConversation(xmtpConversation)

  const totalStart = new Date().getTime()

  await Promise.all([
    refetchConversationSyncAllQuery({
      clientInboxId,
      consentStates: ["allowed"],
    }),
    refetchConversationSyncAllQuery({
      clientInboxId,
      consentStates: ["unknown"],
    }),
    refetchConversationSyncAllQuery({
      clientInboxId,
      consentStates: ["denied"],
    }),
  ])

  const xmtpConversations = await getXmtpConversations({
    clientInboxId,
    consentStates: ["allowed", "unknown", "denied"],
  })

  const totalEnd = new Date().getTime()
  const totalTimeDiff = totalEnd - totalStart

  if (totalTimeDiff > config.xmtp.maxMsUntilLogError) {
    captureError(
      new Error(
        `[useConversationQuery] Fetched conversation (${xmtpConversationId}) in ${totalTimeDiff}ms`,
      ),
    )
  }

  const xmtpConversation = xmtpConversations.find((c) => c.id === xmtpConversationId)

  // If we have the xmtpConversationId the conversation must exist otherwise we did something wrong
  if (!xmtpConversation) {
    throw new Error("XMTP Conversation not found")
  }

  const convosConversation = await convertXmtpConversationToConvosConversation(xmtpConversation)

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
    conversation: IConversationQueryData | undefined
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
        return undefined
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
