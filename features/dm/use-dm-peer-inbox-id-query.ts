/**
 * Deprecate and use conversation.peerInboxId instead
 */
import { queryOptions, useQuery } from "@tanstack/react-query"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { Optional } from "@/types/general"
import logger from "@/utils/logger"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { IConversationTopic } from "../conversation/conversation.types"
import { getOrFetchConversationQuery } from "../conversation/queries/conversation.query"

type IArgs = {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
}

type IArgsWithCaller = IArgs & { caller: string }

export function getDmPeerInboxIdQueryOptions(args: Optional<IArgsWithCaller, "caller">) {
  const { inboxId, topic, caller } = args

  return queryOptions({
    queryKey: ["dm-peer-inbox-id", inboxId, topic],
    queryFn: async function getPeerInboxId() {
      const conversation = await getOrFetchConversationQuery({
        inboxId,
        topic,
        caller: "getPeerInboxId",
      })

      if (!conversation) {
        throw new Error(`Conversation not found with caller ${caller}`)
      }

      if (!isConversationDm(conversation)) {
        throw new Error(`Conversation is not a DM with caller ${caller}`)
      }

      logger.debug(
        `[getPeerInboxId] getting peer inbox id for ${topic}, inboxId: ${inboxId} and caller ${caller}`,
      )

      return conversation.peerInboxId
    },
    meta: {
      caller,
    },
    enabled: !!inboxId && !!topic,
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
