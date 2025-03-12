import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { groupCreatorQueryKey } from "@/queries/QueryKeys"
import { getGroupQueryData } from "./useGroupQuery"

const getGroupCreatorQueryOptions = (args: { account: string; topic: ConversationTopic }) => {
  const { account, topic } = args
  const enabled = !!account && !!topic
  return queryOptions({
    enabled,
    queryKey: groupCreatorQueryKey(account, topic),
    queryFn: enabled
      ? async () => {
          const group = getGroupQueryData({ inboxId: account, topic })
          if (!group) return null
          return group.creatorInboxId()
        }
      : skipToken,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

export const useGroupCreatorQuery = (topic: ConversationTopic) => {
  const account = getSafeCurrentSender().ethereumAddress

  return useQuery(getGroupCreatorQueryOptions({ account, topic }))
}
