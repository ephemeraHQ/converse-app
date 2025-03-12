import { useMutation } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function useRestoreConversation(args: { topic: ConversationTopic }) {
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
