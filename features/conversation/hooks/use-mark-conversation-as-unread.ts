import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { markConversationMetadataAsUnread } from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function useMarkConversationAsUnread(args: { topic: IXmtpConversationTopic }) {
  const { topic } = args

  const currentSender = useSafeCurrentSender()

  const { mutateAsync: markAsUnreadAsync } = useMutation({
    mutationFn: async () => {
      await markConversationMetadataAsUnread({
        clientInboxId: currentSender.inboxId,
        topic,
      })
    },
    onMutate: () => {
      const previousData = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
      })

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
        updateData: {
          unread: true,
        },
      })

      return { previousData }
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        updateConversationMetadataQueryData({
          clientInboxId: currentSender.inboxId,
          topic,
          updateData: context.previousData,
        })
      }
    },
  })

  return {
    markAsUnreadAsync,
  }
}
