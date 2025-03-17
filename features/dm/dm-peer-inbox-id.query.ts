/**
 * Deprecate and use conversation.peerInboxId instead
 */
import { queryOptions, useQuery } from "@tanstack/react-query"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { Optional } from "@/types/general"
import logger from "@/utils/logger"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { ensureConversationQueryData } from "../conversation/queries/conversation.query"

type IArgs = {
  inboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}

type IArgsWithCaller = IArgs & { caller: string }

export function getDmPeerInboxIdQueryOptions(args: Optional<IArgsWithCaller, "caller">) {
  const { inboxId, xmtpConversationId, caller } = args

  return queryOptions({
    queryKey: ["dm-peer-inbox-id", inboxId, xmtpConversationId],
    queryFn: async function getPeerInboxId() {
      const conversation = await ensureConversationQueryData({
        clientInboxId: inboxId,
        xmtpConversationId,
        caller: "getPeerInboxId",
      })

      if (!conversation) {
        throw new Error(`Conversation not found with caller ${caller}`)
      }

      if (!isConversationDm(conversation)) {
        throw new Error(`Conversation is not a DM with caller ${caller}`)
      }

      logger.debug(
        `[getPeerInboxId] getting peer inbox id for ${xmtpConversationId}, inboxId: ${inboxId} and caller ${caller}`,
      )

      return conversation.peerInboxId
    },
    meta: {
      caller,
    },
    enabled: !!inboxId && !!xmtpConversationId,
  })
}

export const useDmPeerInboxIdQuery = (args: IArgsWithCaller) => {
  return useQuery(getDmPeerInboxIdQueryOptions(args))
}

export const ensureDmPeerInboxIdQueryData = async (args: IArgsWithCaller) => {
  return reactQueryClient.ensureQueryData(getDmPeerInboxIdQueryOptions(args))
}

export function getDmPeerInboxIdQueryData(args: IArgs) {
  return reactQueryClient.getQueryData(getDmPeerInboxIdQueryOptions(args).queryKey)
}
