import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { useQuery } from "@tanstack/react-query"
import { getGroupQueryData } from "../../useGroupQuery"

export const useGroupPermissionPolicySetQuery = (
  account: string,
  topic: IXmtpConversationTopic,
) => {
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
