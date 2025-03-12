/**
 * useGroupQuery is derived from useConversationQuery. Like useDmQuery, maybe worth considering if we should just use useConversationQuery instead.
 */
import type { IXmtpConversationTopic, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, useQuery } from "@tanstack/react-query"
import {
  ConversationQueryData,
  getConversationQueryData,
  getConversationQueryOptions,
  getOrFetchConversationQuery,
  setConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"

export function useGroupQuery(args: { inboxId: IXmtpInboxId; topic: IXmtpConversationTopic }) {
  const { inboxId, topic } = args
  return useQuery(
    getGroupQueryOptions({
      inboxId,
      topic,
    }),
  )
}

export function getGroupQueryData(args: { inboxId: IXmtpInboxId; topic: IXmtpConversationTopic }) {
  return getConversationQueryData(args) as IXmtpGroupWithCodecs | null | undefined
}

export function setGroupQueryData(args: {
  inboxId: IXmtpInboxId
  topic: IXmtpConversationTopic
  group: IXmtpGroupWithCodecs
}) {
  const { inboxId, topic, group } = args
  setConversationQueryData({
    inboxId,
    topic,
    conversation: group,
  })
}

export function getGroupQueryOptions(args: {
  inboxId: IXmtpInboxId
  topic: IXmtpConversationTopic
}) {
  const { inboxId, topic } = args
  return queryOptions({
    ...getConversationQueryOptions({
      inboxId,
      topic,
      caller: "getGroupQueryOptions",
    }),
    select: (data) => {
      if (!data) {
        return null
      }
      if (!isConversationGroup(data)) {
        throw new Error("Expected group conversation but received different type")
      }
      return data
    },
  })
}

export function updateGroupQueryData(args: {
  inboxId: IXmtpInboxId
  topic: IXmtpConversationTopic
  updates: Partial<ConversationQueryData>
}) {
  updateConversationQueryData({
    inboxId: args.inboxId,
    topic: args.topic,
    conversationUpdate: args.updates,
  })
}

export function getOrFetchGroupQuery(args: {
  inboxId: IXmtpInboxId
  topic: IXmtpConversationTopic
  caller: string
}) {
  return getOrFetchConversationQuery({
    inboxId: args.inboxId,
    topic: args.topic,
    caller: args.caller,
  })
}
