import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { useGroupQuery } from "@/features/groups/useGroupQuery"
// import { refreshGroup } from "../utils/xmtpRN/conversations";
import { captureError } from "@/utils/capture-error"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  setGroupMembersQueryData,
} from "../../useGroupMembersQuery"

export const usePromoteToAdminMutation = (args: {
  clientInboxId: IXmtpInboxId
  topic: IConversationTopic
}) => {
  const { clientInboxId, topic } = args

  const { data: group } = useGroupQuery({ inboxId: clientInboxId, topic })

  return useMutation({
    mutationFn: async (inboxId: IXmtpInboxId) => {
      if (!group) {
        throw new Error("No group found to promote member to admin")
      }
      await group.addAdmin(inboxId)
      return inboxId
    },
    onMutate: async (inboxId: IXmtpInboxId) => {
      if (!topic) {
        return
      }

      cancelGroupMembersQuery({ clientInboxId: inboxId, topic }).catch(captureError)

      const previousGroupMembers = getGroupMembersQueryData({
        clientInboxId: inboxId,
        topic,
      })
      if (!previousGroupMembers) {
        return
      }

      const newMembers = { ...previousGroupMembers }
      if (!newMembers.byId[inboxId]) {
        return
      }

      newMembers.byId[inboxId].permission = "admin"
      setGroupMembersQueryData({ clientInboxId: inboxId, topic, members: newMembers })

      return { previousGroupMembers }
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousGroupMembers || !topic) {
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
