import { IXmtpConversationTopic } from "@features/xmtp/xmtp.types"
import { MutationOptions, useMutation } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { markConversationMetadataAsRead } from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { formatDateForApi } from "@/utils/api/api.utils"

// Define the type for the mutation context
type MarkAsReadContext = {
  previousData: {
    readUntil?: string
    unread?: boolean
  } | null
}

export function getMarkConversationAsReadMutationOptions(args: {
  topic: IXmtpConversationTopic
}): MutationOptions<void, Error, void, MarkAsReadContext> {
  const { topic } = args

  const currentSender = getSafeCurrentSender()

  return {
    mutationKey: ["markConversationAsRead", topic],
    mutationFn: async () => {
      const readUntil = formatDateForApi(new Date())

      await markConversationMetadataAsRead({
        clientInboxId: currentSender.inboxId,
        topic,
        readUntil,
      })
    },
    onMutate: () => {
      const readUntil = formatDateForApi(new Date())
      const previousData = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
      })

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
        updateData: {
          readUntil,
          unread: false,
        },
      })

      // Extract only the fields we need for rollback
      return {
        previousData: previousData
          ? {
              readUntil: previousData.readUntil,
              unread: previousData.unread,
            }
          : null,
      }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
        updateData: context?.previousData ?? {},
      })
    },
  }
}

export function useMarkConversationAsRead(args: { topic: IXmtpConversationTopic }) {
  const { mutateAsync: markAsReadAsync } = useMutation(
    getMarkConversationAsReadMutationOptions(args),
  )

  return {
    markAsReadAsync,
  }
}
