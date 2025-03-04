import { getGroupQueryData } from "@queries/useGroupQuery"
import { useQuery } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { groupPinnedFrameQueryKey } from "./QueryKeys"

export const useGroupPinnedFrameQuery = (account: string, topic: ConversationTopic) => {
  return useQuery({
    queryKey: groupPinnedFrameQueryKey(account, topic),
    queryFn: async () => {
      const group = getGroupQueryData({ account, topic })
      if (!group || !topic) {
        return
      }
      return ""
      // return group.groupPinnedFrame();
    },
    enabled: !!account && !!topic,
  })
}
