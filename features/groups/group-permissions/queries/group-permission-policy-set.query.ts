import { useQuery } from "@tanstack/react-query"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { getGroupQueryData } from "../../useGroupQuery"

export const useGroupPermissionPolicySetQuery = (account: string, topic: IConversationTopic) => {
  return useQuery({
    queryKey: ["group-permission-policy-set", account, topic],
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
