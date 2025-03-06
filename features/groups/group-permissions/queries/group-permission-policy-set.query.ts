import { useQuery } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { groupPermissionPolicyQueryKey } from "../../../../queries/QueryKeys"
import { getGroupQueryData } from "../../../../queries/useGroupQuery"

export const useGroupPermissionPolicySetQuery = (account: string, topic: ConversationTopic) => {
  return useQuery({
    queryKey: groupPermissionPolicyQueryKey(account, topic!),
    queryFn: () => {
      const group = getGroupQueryData({ account, topic })
      if (!group) {
        return
      }

      return group.permissionPolicySet()
    },
    enabled: !!topic,
  })
}
