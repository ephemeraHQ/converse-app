import { useMutation } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client"
import { captureError } from "@/utils/capture-error"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  setGroupMembersQueryData,
} from "../../useGroupMembersQuery"
import { useGroupQuery } from "../../useGroupQuery"

export const usePromoteToSuperAdminMutation = (args: {
  clientInboxId: InboxId
  topic: ConversationTopic
}) => {
  const { clientInboxId, topic } = args

  const { data: group } = useGroupQuery({ inboxId: clientInboxId, topic })

  return useMutation({
    mutationFn: async (inboxId: InboxId) => {
      if (!group) {
        throw new Error("No group found to promote member to super admin")
      }
      return group.addSuperAdmin(inboxId)
    },
    onMutate: async (inboxId: InboxId) => {
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

      const newMembers = { ...previousGroupMembers }
      if (!newMembers.byId[inboxId]) {
        return
      }

      newMembers.byId[inboxId].permission = "super_admin"
      setGroupMembersQueryData({
        clientInboxId,
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
