import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken } from "@tanstack/react-query"
import { ensureConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { setConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type IUnknownConversationsQueryData = Awaited<
  ReturnType<typeof getUnknownConversationsQueryFn>
>

async function getUnknownConversationsQueryFn(args: { inboxId: IXmtpInboxId }) {
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
      xmtpConversationId: conversation.xmtpId,
      conversation,
    })
  }

  return convosConversations.map((c) => c.xmtpId)
}

export const getUnknownConsentConversationsQueryData = (args: { inboxId: IXmtpInboxId }) => {
  return reactQueryClient.getQueryData(getUnknownConsentConversationsQueryOptions(args).queryKey)
}

export function addConversationToUnknownConsentConversationsQuery(args: {
  clientInboxId: IXmtpInboxId
  conversationId: IXmtpConversationId
}) {
  const { clientInboxId, conversationId } = args

  return reactQueryClient.setQueryData(
    getUnknownConsentConversationsQueryOptions({
      inboxId: clientInboxId,
      caller: "addConversationToUnknownConsentConversationsQuery",
    }).queryKey,
    (previousConversationIds) => {
      if (!previousConversationIds) {
        return [conversationId]
      }

      const conversationExists = previousConversationIds.includes(conversationId)

      if (conversationExists) {
        return previousConversationIds
      }

      return [conversationId, ...previousConversationIds]
    },
  )
}

export function removeConversationFromUnknownConsentConversationsQuery(args: {
  clientInboxId: IXmtpInboxId
  conversationId: IXmtpConversationId
}) {
  const { clientInboxId, conversationId } = args

  return reactQueryClient.setQueryData(
    getUnknownConsentConversationsQueryOptions({
      inboxId: clientInboxId,
      caller: "removeConversationFromUnknownConsentConversationsQuery",
    }).queryKey,
    (previousConversationIds) => {
      if (!previousConversationIds) {
        return []
      }

      return previousConversationIds.filter((id) => id !== conversationId)
    },
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
          getUnknownConversationsQueryFn({
            inboxId,
          })
      : skipToken,
  })
}
