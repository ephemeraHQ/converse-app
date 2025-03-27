import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export function useRestoreConversation(args: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = args

  const currentSender = useSafeCurrentSender()

  const { mutateAsync: restoreConversationAsync } = useMutation({
    mutationFn: () => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        updateData: { deleted: false },
      })
      return Promise.resolve()
    },
    onMutate: () => {
      const previousDeleted = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
      })?.deleted

      return { previousDeleted }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        updateData: { deleted: context?.previousDeleted },
      })
    },
  })

  return {
    restoreConversationAsync,
  }
}
