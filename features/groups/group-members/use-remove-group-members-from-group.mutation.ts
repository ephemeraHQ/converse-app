import { useMutation } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client"
import { useGroupQuery } from "@/features/groups/useGroupQuery"
import { captureError } from "@/utils/capture-error"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  removeMembersFromGroupQueryData,
  setGroupMembersQueryData,
} from "../useGroupMembersQuery"

export const useRemoveGroupMembersFromGroupMutation = (
  account: string,
  topic: ConversationTopic,
) => {
  const { data: group } = useGroupQuery({ account, topic })

  return useMutation({
    mutationFn: async (inboxIds: InboxId[]) => {
      if (!group) {
        throw new Error("No group found to remove members from")
      }
      return group.removeMembersByInboxId(inboxIds)
    },
    onMutate: async (inboxIds: InboxId[]) => {
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

      removeMembersFromGroupQueryData({
        account,
        topic,
        memberInboxIds: inboxIds,
      })

      return { previousGroupMembers }
    },
    onError: (error, _variables, context) => {
      if (!context?.previousGroupMembers) {
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
