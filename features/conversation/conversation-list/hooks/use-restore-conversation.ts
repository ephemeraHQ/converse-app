import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function useRestoreConversation(args: { topic: IXmtpConversationTopic }) {
  const { topic } = args

  const currentSender = useSafeCurrentSender()

  const { mutateAsync: restoreConversationAsync } = useMutation({
    mutationFn: () => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
        updateData: { deleted: false },
      })
      return Promise.resolve()
    },
    onMutate: () => {
      const previousDeleted = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
      })?.deleted

      return { previousDeleted }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
        updateData: { deleted: context?.previousDeleted },
      })
    },
  })

  return {
    restoreConversationAsync,
  }
}
