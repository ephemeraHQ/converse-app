/**
 * useGroupQuery is derived from useConversationQuery. Like useDmQuery, maybe worth considering if we should just use useConversationQuery instead.
 */
import { queryOptions, useQuery } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import {
  ConversationQueryData,
  getConversationQueryData,
  getConversationQueryOptions,
  getOrFetchConversation,
  setConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/conversation-query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"

export function useGroupQuery(args: { account: string; topic: ConversationTopic }) {
  const { account, topic } = args
  return useQuery(
    getGroupQueryOptions({
      account,
      topic,
    }),
  )
}

export function getGroupQueryData(args: { account: string; topic: ConversationTopic }) {
  return getConversationQueryData(args) as IXmtpGroupWithCodecs | null | undefined
}

export function setGroupQueryData(args: {
  account: string
  topic: ConversationTopic
  group: IXmtpGroupWithCodecs
}) {
  const { account, topic, group } = args
  setConversationQueryData({
    account,
    topic,
    conversation: group,
  })
}

export function getGroupQueryOptions(args: { account: string; topic: ConversationTopic }) {
  const { account, topic } = args
  return queryOptions({
    ...getConversationQueryOptions({
      account,
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
  account: string
  topic: ConversationTopic
  updates: Partial<ConversationQueryData>
}) {
  updateConversationQueryData({
    account: args.account,
    topic: args.topic,
    conversationUpdate: args.updates,
  })
}

export function getOrFetchGroupQuery(args: {
  account: string
  topic: ConversationTopic
  caller: string
}) {
  return getOrFetchConversation(args)
}
