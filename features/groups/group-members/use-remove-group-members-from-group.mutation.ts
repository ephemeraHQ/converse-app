import { useMutation } from "@tanstack/react-query"
import { type ConversationTopic } from "@xmtp/react-native-sdk"
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client"
import { useGroupQuery } from "@/features/groups/useGroupQuery"
import { removeXmtpGroupMembers } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { captureError } from "@/utils/capture-error"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  removeMembersFromGroupQueryData,
  setGroupMembersQueryData,
} from "../useGroupMembersQuery"

export const useRemoveGroupMembersFromGroupMutation = (args: {
  topic: ConversationTopic
  clientInboxId: InboxId
}) => {
  const { topic, clientInboxId } = args

  const { data: group } = useGroupQuery({ inboxId: clientInboxId, topic })

  return useMutation({
    mutationFn: async (inboxIds: InboxId[]) => {
      if (!group) {
        throw new Error("No group found to remove members from")
      }
      return removeXmtpGroupMembers({ group, inboxIds })
    },
    onMutate: async (inboxIds: InboxId[]) => {
      if (!topic) {
        return
      }

      cancelGroupMembersQuery({ clientInboxId, topic }).catch(captureError)

      const previousGroupMembers = getGroupMembersQueryData({
        clientInboxId,
        topic,
      })

      if (!previousGroupMembers) {
        return
      }

      removeMembersFromGroupQueryData({
        clientInboxId,
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
        clientInboxId,
        topic,
        members: context.previousGroupMembers,
      })
    },
    onSuccess: () => {
      invalidateGroupMembersQuery({ clientInboxId, topic }).catch(captureError)
    },
  })
}
