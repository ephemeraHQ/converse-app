import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getGroupQueryData,
  invalidateGroupQuery,
  setGroupQueryData,
} from "@/features/groups/queries/group.query"
import { addXmtpGroupMembers } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { IGroup } from "../group.types"

type AddGroupMembersVariables = {
  group: IGroup
  inboxIds: IXmtpInboxId[]
}

export function useAddGroupMembersMutation() {
  const currentSender = useSafeCurrentSender()

  return useMutation({
    mutationFn: async (variables: AddGroupMembersVariables) => {
      const { group, inboxIds } = variables
      return addXmtpGroupMembers({
        clientInboxId: currentSender.inboxId,
        groupId: group.xmtpId,
        inboxIds,
      })
    },
    onMutate: async (variables: AddGroupMembersVariables) => {
      const { group, inboxIds } = variables

      // Get current group
      const previousGroup = getGroupQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: group.xmtpId,
      })

      if (!previousGroup) {
        return
      }

      // Create a new group object with the added members
      const updatedGroup = {
        ...previousGroup,
        members: {
          ...previousGroup.members,
          byId: { ...previousGroup.members.byId },
          ids: [...previousGroup.members.ids],
        },
      }

      // Add the new members
      for (const inboxId of inboxIds) {
        if (!updatedGroup.members.ids.includes(inboxId)) {
          updatedGroup.members.ids.push(inboxId)
        }

        updatedGroup.members.byId[inboxId] = {
          inboxId,
          permission: "member",
          consentState: "unknown",
        }
      }

      // Update the group data
      setGroupQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: group.xmtpId,
        group: updatedGroup,
      })

      return { previousGroup }
    },
    onError: (_error, variables, context) => {
      // Roll back to previous group on error
      if (context?.previousGroup) {
        setGroupQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: variables.group.xmtpId,
          group: context.previousGroup,
        })
      }
    },
    onSettled: (_data, _error, variables) => {
      // Invalidate and refetch after error or success
      invalidateGroupQuery({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: variables.group.xmtpId,
      })
    },
  })
}
