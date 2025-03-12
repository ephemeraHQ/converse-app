import { useMutation } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
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

export function usePinOrUnpinConversation(args: { conversationTopic: ConversationTopic }) {
  const { conversationTopic } = args

  const currentSender = useSafeCurrentSender()

  const { mutateAsync: pinConversationAsync } = useMutation({
    mutationFn: () => {
      return pinConversationMetadata({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
      })
    },
    onMutate: () => {
      const previousPinned = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
      })?.pinned

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
        updateData: { pinned: true },
      })

      return { previousPinned }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
        updateData: { pinned: context?.previousPinned },
      })
    },
  })

  const { mutateAsync: unpinConversationAsync } = useMutation({
    mutationFn: () => {
      return unpinConversationMetadata({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
      })
    },
    onMutate: () => {
      const previousPinned = getConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
      })?.pinned

      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
        updateData: { pinned: false },
      })

      return { previousPinned }
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        clientInboxId: currentSender.inboxId,
        topic: conversationTopic,
        updateData: { pinned: context?.previousPinned },
      })
    },
  })

  const pinOrUnpinConversationAsync = useCallback(async () => {
    const isPinned = getConversationMetadataQueryData({
      clientInboxId: currentSender.inboxId,
      topic: conversationTopic,
    })?.pinned

    if (isPinned) {
      return unpinConversationAsync()
    } else {
      return pinConversationAsync()
    }
  }, [conversationTopic, currentSender, pinConversationAsync, unpinConversationAsync])

  return {
    pinOrUnpinConversationAsync,
  }
}
