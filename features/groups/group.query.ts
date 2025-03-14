/**
 * useGroupQuery is derived from useConversationQuery. Like useDmQuery, maybe worth considering if we should just use useConversationQuery instead.
 */
import type { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, useQuery } from "@tanstack/react-query"
import {
  getConversationQueryData,
  getOrFetchConversationQuery,
  setConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import type { IConversationTopic } from "../conversation/conversation.types"

type IGroupQueryData = Awaited<ReturnType<typeof getGroup>>

async function getGroup(args: { inboxId: IXmtpInboxId; topic: IConversationTopic }) {
  const { inboxId, topic } = args

  const group = await getOrFetchConversationQuery({
    inboxId,
    topic,
    caller: "getGroup",
  })

  if (!group) {
    return null
  }

  if (!isConversationGroup(group)) {
    throw new Error("Expected group conversation but received different type")
  }

  return group
}

export function useGroupQuery(args: { inboxId: IXmtpInboxId; topic: IConversationTopic }) {
  const { inboxId, topic } = args
  return useQuery(
    getGroupQueryOptions({
      inboxId,
      topic,
    }),
  )
}

export function getGroupQueryData(args: { inboxId: IXmtpInboxId; topic: IConversationTopic }) {
  return getConversationQueryData(args) as IGroupQueryData
}

export function setGroupQueryData(args: {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
  group: IGroupQueryData
}) {
  const { inboxId, topic, group } = args
  setConversationQueryData({
    inboxId,
    topic,
    conversation: group,
  })
}

export function getGroupQueryOptions(args: { inboxId: IXmtpInboxId; topic: IConversationTopic }) {
  const { inboxId, topic } = args
  return queryOptions({
    queryKey: ["group", inboxId, topic],
    enabled: !!topic && !!inboxId,
    queryFn: () =>
      getGroup({
        inboxId,
        topic,
      }),
  })
}

export function updateGroupQueryData(args: {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
  updates: Partial<IGroupQueryData>
}) {
  updateConversationQueryData({
    inboxId: args.inboxId,
    topic: args.topic,
    conversationUpdate: args.updates,
  })
}

export function getOrFetchGroupQuery(args: {
  inboxId: IXmtpInboxId
  topic: IConversationTopic
  caller: string
}) {
  return getOrFetchConversationQuery({
    inboxId: args.inboxId,
    topic: args.topic,
    caller: args.caller,
  })
}
