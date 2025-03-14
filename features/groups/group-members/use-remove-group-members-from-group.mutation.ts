import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { useGroupQuery } from "@/features/groups/group.query"
import { removeXmtpGroupMembers } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { captureError } from "@/utils/capture-error"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  removeMembersFromGroupQueryData,
  setGroupMembersQueryData,
} from "../group-members.query"

export const useRemoveGroupMembersFromGroupMutation = (args: {
  topic: IConversationTopic
  clientInboxId: IXmtpInboxId
}) => {
  const { topic, clientInboxId } = args

  const { data: group } = useGroupQuery({ inboxId: clientInboxId, topic })

  return useMutation({
    mutationFn: async (inboxIds: IXmtpInboxId[]) => {
      if (!group) {
        throw new Error("No group found to remove members from")
      }
      return removeXmtpGroupMembers({
        clientInboxId,
        groupId: group.id as unknown as IXmtpConversationId,
        inboxIds,
      })
    },
    onMutate: async (inboxIds: IXmtpInboxId[]) => {
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
