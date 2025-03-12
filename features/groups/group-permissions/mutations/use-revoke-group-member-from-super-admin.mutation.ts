import { useMutation } from "@tanstack/react-query"
import type { ConversationTopic } from "@xmtp/react-native-sdk"
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client"
import { useGroupQuery } from "@/features/groups/useGroupQuery"
import { captureError } from "@/utils/capture-error"
import {
  cancelGroupMembersQuery,
  getGroupMembersQueryData,
  invalidateGroupMembersQuery,
  setGroupMembersQueryData,
} from "../../useGroupMembersQuery"

// import { refreshGroup } from "../utils/xmtpRN/conversations";

export const useRevokeSuperAdminMutation = (args: {
  clientInboxId: InboxId
  topic: ConversationTopic
}) => {
  const { clientInboxId, topic } = args

  const { data: group } = useGroupQuery({ inboxId: clientInboxId, topic })

  return useMutation({
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

      newMembers.byId[inboxId].permission = "member"
      setGroupMembersQueryData({
        clientInboxId: inboxId,
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
        clientInboxId: clientInboxId,
        topic,
        members: context.previousGroupMembers,
      })
    },
    onSuccess: () => {
      invalidateGroupMembersQuery({ clientInboxId: clientInboxId, topic }).catch(captureError)
    },
  })
}
