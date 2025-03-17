import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { QueryObserver, queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { IConversation } from "@/features/conversation/conversation.types"
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
  const { clientInboxId, conversation } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    clientInboxId,
  })

  if (!previousConversationsData) {
    reactQueryClient.setQueryData(
      getAllowedConsentConversationsQueryOptions({ clientInboxId }).queryKey,
      [conversation],
    )
    return
  }

  const conversationExists = previousConversationsData.some((c) => c.xmtpId === conversation.xmtpId)

  if (conversationExists) {
    return updateConversationInAllowedConsentConversationsQueryData({
      clientInboxId,
      xmtpConversationId: conversation.xmtpId,
      conversationUpdate: conversation,
    })
  }

  reactQueryClient.setQueryData<IAllowedConsentConversationsQuery>(
    getAllowedConsentConversationsQueryOptions({ clientInboxId }).queryKey,
    [conversation, ...previousConversationsData],
  )
}

export const removeConversationFromAllowedConsentConversationsQuery = (
  args: IArgs & {
    xmtpConversationId: IXmtpConversationId
  },
) => {
  const { clientInboxId, xmtpConversationId } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    clientInboxId,
  })

  if (!previousConversationsData) {
    return
  }

  reactQueryClient.setQueryData(
    getAllowedConsentConversationsQueryOptions({ clientInboxId }).queryKey,
    previousConversationsData.filter((c) => c.xmtpId !== xmtpConversationId),
  )
}

export const getAllowedConsentConversationsQueryData = (args: IArgs) => {
  return reactQueryClient.getQueryData(getAllowedConsentConversationsQueryOptions(args).queryKey)
}

const getAllowedConsentConversations = async (args: IArgs) => {
  const { clientInboxId } = args

  await ensureConversationSyncAllQuery({
    clientInboxId,
    consentStates: ["allowed"],
  })

  const conversations = await getXmtpConversations({
    clientInboxId,
    consentStates: ["allowed"],
  })

  const convosConversations = await Promise.all(
    conversations.map(convertXmtpConversationToConvosConversation),
  )

  for (const convoConversation of convosConversations) {
    // Only set if the conversation is not already in the query cache
    // Because otherwise we might put a outdated conversation in the query cache.
    if (
      !getConversationQueryData({
        clientInboxId,
        xmtpConversationId: convoConversation.xmtpId,
      })
    ) {
      setConversationQueryData({
        clientInboxId,
        xmtpConversationId: convoConversation.xmtpId,
        conversation: convoConversation,
      })
    }
  }

  return convosConversations
}

export const getAllowedConsentConversationsQueryOptions = (
  args: Optional<IArgsWithCaller, "caller">,
) => {
  const { clientInboxId, caller } = args
  const enabled = !!clientInboxId
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: ["allowed-consent-conversations", clientInboxId],
    queryFn: enabled ? () => getAllowedConsentConversations({ clientInboxId }) : skipToken,
    enabled,
  })
}

export const updateConversationInAllowedConsentConversationsQueryData = (
  args: IArgs & {
    xmtpConversationId: IXmtpConversationId
    conversationUpdate: Partial<IConversation>
  },
) => {
  const { clientInboxId, xmtpConversationId, conversationUpdate } = args

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    clientInboxId,
  })

  if (!previousConversationsData) {
    captureError(
      new Error(
        `No previous conversations data found for account: ${clientInboxId} when updating conversation in allowed consent conversations query data: ${JSON.stringify(
          conversationUpdate,
        )}`,
      ),
    )
    return
  }

  const newConversations = previousConversationsData.map((c) => {
    if (c.xmtpId === xmtpConversationId) {
      return updateObjectAndMethods(c, conversationUpdate)
    }
    return c
  })

  return reactQueryClient.setQueryData<IAllowedConsentConversationsQuery>(
    getAllowedConsentConversationsQueryOptions({
      clientInboxId,
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
