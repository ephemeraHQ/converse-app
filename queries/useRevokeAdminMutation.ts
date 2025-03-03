import { useMutation } from "@tanstack/react-query"
import { logger } from "@utils/logger"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client"
import { captureError } from "@/utils/capture-error"
import { revokeAdminMutationKey } from "./MutationKeys"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  setGroupMembersQueryData,
} from "./useGroupMembersQuery"
import { useGroupQuery } from "./useGroupQuery"

export const useRevokeAdminMutation = (account: string, topic: ConversationTopic) => {
  const { data: group } = useGroupQuery({ account, topic })

  return useMutation({
    mutationKey: revokeAdminMutationKey(account, topic!),
    mutationFn: async (inboxId: InboxId) => {
      if (!group || !account || !topic) {
        return
      }
      await group.removeAdmin(inboxId)
      return inboxId
    },
    onMutate: async (inboxId: InboxId) => {
      if (!topic) {
        return
      }
      await cancelGroupMembersQuery({ account, topic })

      const previousGroupMembers = getGroupMembersQueryData({
        account,
        topic,
      })
      if (!previousGroupMembers) {
        return
      }
      const newMembers = { ...previousGroupMembers }
      if (!newMembers.byId[inboxId]) {
        return
      }
      newMembers.byId[inboxId].permissionLevel = "member"
      setGroupMembersQueryData({ account, topic, members: newMembers })

      return { previousGroupMembers }
    },
    onError: (error, _variables, context) => {
      captureError(error)
      if (context?.previousGroupMembers === undefined) {
        return
      }
      if (!topic) {
        return
      }
      setGroupMembersQueryData({
        account,
        topic,
        members: context.previousGroupMembers,
      })
    },
    onSuccess: (data, variables, context) => {
      logger.debug("onSuccess useRevokeAdminMutation")
      // refreshGroup(account, topic);
    },
  })
}
