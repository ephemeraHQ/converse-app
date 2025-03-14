import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  addGroupMembersToQueryData,
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  setGroupMembersQueryData,
} from "@/features/groups/group-members.query"
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
        groupId: group.id as unknown as IXmtpConversationId,
        inboxIds,
      })
    },
    onMutate: async (variables: AddGroupMembersVariables) => {
      const { group, inboxIds } = variables

      // Cancel any outgoing refetches
      await cancelGroupMembersQuery({
        clientInboxId: currentSender.inboxId,
        topic: group.topic,
      })

      // Get current group members
      const previousMembers = getGroupMembersQueryData({
        clientInboxId: currentSender.inboxId,
        topic: group.topic,
      })

      for (const inboxId of inboxIds) {
        // Create optimistic members
        addGroupMembersToQueryData({
          clientInboxId: currentSender.inboxId,
          topic: group.topic,
          member: {
            inboxId,
            permission: "member",
            consentState: "allowed",
          },
        })
      }

      return { previousMembers }
    },
    onError: (_error, variables, context) => {
      // Roll back to previous members on error
      if (context?.previousMembers) {
        setGroupMembersQueryData({
          clientInboxId: currentSender.inboxId,
          topic: variables.group.topic,
          members: context.previousMembers,
        })
      }
    },
    onSettled: (_data, _error, variables) => {
      // Invalidate and refetch after error or success
      invalidateGroupMembersQuery({
        clientInboxId: currentSender.inboxId,
        topic: variables.group.topic,
      })
    },
  })
}
