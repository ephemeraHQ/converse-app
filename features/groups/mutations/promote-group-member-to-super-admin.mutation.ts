import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import {
  getGroupQueryData,
  invalidateGroupQuery,
  setGroupQueryData,
  useGroupQuery,
} from "@/features/groups/queries/group.query"
import { addSuperAdminToXmtpGroup } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"

export const usePromoteToSuperAdminMutation = (args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}) => {
  const { clientInboxId, xmtpConversationId } = args

  const { data: group } = useGroupQuery({ clientInboxId: clientInboxId, xmtpConversationId })

  return useMutation({
    mutationFn: async (inboxId: IXmtpInboxId) => {
      if (!group) {
        throw new Error("No group found to promote member to super admin")
      }
      await addSuperAdminToXmtpGroup({
        clientInboxId,
        groupId: group.xmtpId,
        superAdminInboxId: inboxId,
      })
      return inboxId
    },
    onMutate: async (inboxId: IXmtpInboxId) => {
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

      const updatedGroup = {
        ...previousGroup,
        members: {
          ...previousGroup.members,
          byId: {
            ...previousGroup.members.byId,
            [inboxId]: {
              ...previousGroup.members.byId[inboxId],
              permission: "super_admin",
            },
          },
        },
      }

      setGroupQueryData({
        clientInboxId,
        xmtpConversationId,
        group: updatedGroup,
      })

      return { previousGroup }
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousGroup || !xmtpConversationId) {
        return
      }

      setGroupQueryData({
        clientInboxId,
        xmtpConversationId,
        group: context.previousGroup,
      })
    },
    onSuccess: () => {
      invalidateGroupQuery({ clientInboxId, xmtpConversationId })
    },
  })
}
