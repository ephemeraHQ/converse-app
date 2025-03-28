import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import {
  getGroupQueryData,
  invalidateGroupQuery,
  setGroupQueryData,
  useGroupQuery,
} from "@/features/groups/queries/group.query"
import { removeXmtpGroupMembers } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { captureError } from "@/utils/capture-error"

export const useRemoveGroupMembersFromGroupMutation = (args: {
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
}) => {
  const { xmtpConversationId, clientInboxId } = args

  const { data: group } = useGroupQuery({ clientInboxId: clientInboxId, xmtpConversationId })

  return useMutation({
    mutationFn: async (inboxIds: IXmtpInboxId[]) => {
      if (!group) {
        throw new Error("No group found to remove members from")
      }
      return removeXmtpGroupMembers({
        clientInboxId,
        groupId: group.xmtpId,
        inboxIds,
      })
    },
    onMutate: async (inboxIds: IXmtpInboxId[]) => {
      if (!xmtpConversationId) {
        return
      }

      const previousGroup = getGroupQueryData({
        clientInboxId,
        xmtpConversationId,
      })

      if (!previousGroup) {
        return
      }

      // Create a new group object with the members removed
      const updatedGroup = {
        ...previousGroup,
        members: {
          ...previousGroup.members,
          byId: { ...previousGroup.members.byId },
          ids: previousGroup.members.ids.filter((id) => !inboxIds.includes(id)),
        },
      }

      // Remove the members from the byId object
      inboxIds.forEach((id) => {
        delete updatedGroup.members.byId[id]
      })

      // Update the group data
      setGroupQueryData({
        clientInboxId,
        xmtpConversationId,
        group: updatedGroup,
      })

      return { previousGroup }
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousGroup) {
        return
      }

      // Restore the previous group data
      setGroupQueryData({
        clientInboxId,
        xmtpConversationId,
        group: context.previousGroup,
      })
    },
    onSuccess: () => {
      // Invalidate the group query to refresh data
      invalidateGroupQuery({ clientInboxId, xmtpConversationId }).catch(captureError)
    },
  })
}
