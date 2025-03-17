import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  pinConversationMetadata,
  unpinConversationMetadata,
} from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

export function usePinOrUnpinConversation(args: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = args

  const currentSender = useSafeCurrentSender()

  const { mutateAsync: pinConversationAsync } = useMutation({
    mutationFn: () => {
      return pinConversationMetadata({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
      })
    },
    onMutate: () => {
      const previousPinned = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
      })?.pinned

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
        updateData: { pinned: true },
      })

      return { previousPinned }
    },
    onError: (__, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
        updateData: { pinned: context?.previousPinned },
      })
    },
  })

  const { mutateAsync: unpinConversationAsync } = useMutation({
    mutationFn: () => {
      return unpinConversationMetadata({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
      })
    },
    onMutate: () => {
      const previousPinned = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
      })?.pinned

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
        updateData: { pinned: false },
      })

      return { previousPinned }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: xmtpConversationId,
        updateData: { pinned: context?.previousPinned },
      })
    },
  })

  const pinOrUnpinConversationAsync = useCallback(async () => {
    const isPinned = getConversationMetadataQueryData({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId: xmtpConversationId,
    })?.pinned

    if (isPinned) {
      return unpinConversationAsync()
    } else {
      return pinConversationAsync()
    }
  }, [xmtpConversationId, currentSender, pinConversationAsync, unpinConversationAsync])

  return {
    pinOrUnpinConversationAsync,
  }
}
