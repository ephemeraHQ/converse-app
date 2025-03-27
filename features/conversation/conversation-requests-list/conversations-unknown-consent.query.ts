import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken } from "@tanstack/react-query"
import { refetchConversationSyncAllQuery } from "@/features/conversation/queries/conversation-sync-all.query"
import { setConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { convertXmtpConversationToConvosConversation } from "@/features/conversation/utils/convert-xmtp-conversation-to-convos"
import { getXmtpConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-list"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type IUnknownConversationsQueryData = Awaited<
  ReturnType<typeof getUnknownConversationsQueryFn>
>

async function getUnknownConversationsQueryFn(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  if (!inboxId) {
    throw new Error("InboxId is required")
  }

  await refetchConversationSyncAllQuery({
    clientInboxId: inboxId,
  })

  const unknownConsentXmtpConversations = await getXmtpConversations({
    clientInboxId: inboxId,
    consentStates: ["unknown"],
  })

  const convosConversations = await Promise.all(
    unknownConsentXmtpConversations.map(convertXmtpConversationToConvosConversation),
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
