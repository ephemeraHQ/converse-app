import { useQuery } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { groupPermissionPolicyQueryKey } from "../../../../queries/QueryKeys"
import { getGroupQueryData } from "../../useGroupQuery"

export const useGroupPermissionPolicySetQuery = (account: string, topic: ConversationTopic) => {
  return useQuery({
    queryKey: groupPermissionPolicyQueryKey(account, topic!),
    queryFn: () => {
      const group = getGroupQueryData({ inboxId: account, topic })
      if (!group) {
        return
      }

      return group.permissionPolicySet()
    },
    enabled: !!topic,
  })
}
