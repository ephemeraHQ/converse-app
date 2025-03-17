import { useMutation } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { markConversationMetadataAsUnread } from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export function useMarkConversationAsUnread(args: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = args

  const currentSender = useSafeCurrentSender()

  const { mutateAsync: markAsUnreadAsync } = useMutation({
    mutationFn: async () => {
      await markConversationMetadataAsUnread({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
      })
    },
    onMutate: () => {
      const previousData = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
      })

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        updateData: {
          unread: true,
        },
      })

      return { previousData }
    },
    onError: (__, _, context) => {
      if (context?.previousData) {
        updateConversationMetadataQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId,
          updateData: context.previousData,
        })
      }
    },
  })

  return {
    markAsUnreadAsync,
  }
}
