import { useMutation } from "@tanstack/react-query"
import { getGroupQueryData, updateGroupQueryData } from "@/features/groups/group.query"
import { updateXmtpGroupImage } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

type IArgs = {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
}

export function useGroupPhotoMutation(args: IArgs) {
  const { clientInboxId, xmtpConversationId } = args

  return useMutation({
    mutationFn: async (groupImageUrl: string) => {
      await updateXmtpGroupImage({
        clientInboxId,
        xmtpConversationId,
        imageUrl: groupImageUrl,
      })
      return groupImageUrl
    },
    onMutate: async (groupImageUrl: string) => {
      const previousGroup = getGroupQueryData({ clientInboxId: clientInboxId, xmtpConversationId })
      const updates = { imageUrl: groupImageUrl }

      if (previousGroup) {
        updateGroupQueryData({ clientInboxId: clientInboxId, xmtpConversationId, updates })
      }

      return { previousGroup }
    },
    onError: (error, _variables, context) => {
      const { previousGroup } = context || {}

      const updates = { imageUrl: previousGroup?.imageUrl ?? "" }

      updateGroupQueryData({ clientInboxId: clientInboxId, xmtpConversationId, updates })
    },
  })
}
