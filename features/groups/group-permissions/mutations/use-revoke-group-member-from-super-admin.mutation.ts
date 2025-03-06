import { useGroupQuery } from "@queries/useGroupQuery"
import { useMutation } from "@tanstack/react-query"
import { logger } from "@utils/logger"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client"
import { captureError } from "@/utils/capture-error"
import { revokeSuperAdminMutationKey } from "../../../../queries/MutationKeys"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  setGroupMembersQueryData,
} from "../../../../queries/useGroupMembersQuery"

// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useRevokeSuperAdminMutation = (account: string, topic: ConversationTopic) => {
  const { data: group } = useGroupQuery({ account, topic })

  return useMutation({
    mutationKey: revokeSuperAdminMutationKey(account, topic!),
    mutationFn: async (inboxId: InboxId) => {
      if (!group) {
        throw new Error("No group found to revoke super admin from")
      }
      return group.removeSuperAdmin(inboxId)
    },
    onMutate: async (inboxId: InboxId) => {
      if (!topic) {
        return
      }

      cancelGroupMembersQuery({ account, topic }).catch(captureError)

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

      newMembers.byId[inboxId].permission = "member"
      setGroupMembersQueryData({
        account,
        topic,
        members: newMembers,
      })

      return { previousGroupMembers }
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousGroupMembers || !topic) {
        return
      }

      setGroupMembersQueryData({
        account,
        topic,
        members: context.previousGroupMembers,
      })
    },
    onSuccess: () => {
      invalidateGroupMembersQuery({ account, topic }).catch(captureError)
    },
  })
}
