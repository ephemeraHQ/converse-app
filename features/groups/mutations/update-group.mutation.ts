import type { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { IGroup } from "@/features/groups/group.types"
import { getGroupQueryData, updateGroupQueryData } from "@/features/groups/queries/group.query"
import {
  updateXmtpGroupDescription,
  updateXmtpGroupImage,
  updateXmtpGroupName,
} from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"

type IUpdateGroupArgs = {
  name?: string
  description?: string
  imageUrl?: string
}

export function useUpdateGroup(args: {
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
}) {
  const { xmtpConversationId, clientInboxId } = args

  return useMutation({
    mutationFn: async (args: IUpdateGroupArgs) => {
      const { name, description, imageUrl } = args

      const group = getGroupQueryData({ clientInboxId, xmtpConversationId })

      if (!group) {
        throw new Error("Missing required data in updateGroup")
      }

      const promises = []

      promises.push(
        updateXmtpGroupName({
          clientInboxId,
          xmtpConversationId: group.xmtpId,
          name,
        }),
      )

      promises.push(
        updateXmtpGroupDescription({
          clientInboxId,
          xmtpConversationId: group.xmtpId,
          description,
        }),
      )

      promises.push(
        updateXmtpGroupImage({
          clientInboxId,
          xmtpConversationId: group.xmtpId,
          imageUrl,
        }),
      )

      await Promise.all(promises)
    },
    onMutate: (args: IUpdateGroupArgs) => {
      const { name, description, imageUrl } = args
      const previousGroup = getGroupQueryData({ clientInboxId, xmtpConversationId })
      const updates: Partial<IGroup> = {
        ...previousGroup,
        name,
        description,
        imageUrl,
      }

      if (previousGroup) {
        updateGroupQueryData({ clientInboxId, xmtpConversationId, updates })
      }

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      const { previousGroup } = context || {}

      const updates: Partial<IGroup> = {
        name: previousGroup?.name ?? "",
        description: previousGroup?.description ?? "",
        imageUrl: previousGroup?.imageUrl ?? "",
      }
      console.log("revert:", updates)

      updateGroupQueryData({ clientInboxId, xmtpConversationId, updates })
    },
  })
}
