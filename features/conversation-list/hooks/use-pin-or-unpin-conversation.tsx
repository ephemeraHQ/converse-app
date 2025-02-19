import {
  pinConversation,
  unpinConversation,
} from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/features/multi-inbox/multi-inbox.store";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export function usePinOrUnpinConversation(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const currentAccount = useCurrentAccount()!;

  const { mutateAsync: pinConversationAsync } = useMutation({
    mutationFn: () => {
      return pinConversation({
        account: currentAccount,
        topic: conversationTopic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousPinned = getConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
      })?.pinned;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { pinned: true },
      });

      return { previousPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { pinned: context?.previousPinned },
      });
    },
  });

  const { mutateAsync: unpinConversationAsync } = useMutation({
    mutationFn: () => {
      return unpinConversation({
        account: currentAccount,
        topic: conversationTopic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousPinned = getConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
      })?.pinned;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { pinned: false },
      });

      return { previousPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { pinned: context?.previousPinned },
      });
    },
  });

  const pinOrUnpinConversationAsync = useCallback(async () => {
    const currentAccount = getCurrentAccount()!;
    const isPinned = getConversationMetadataQueryData({
      account: currentAccount,
      topic: conversationTopic,
    })?.pinned;

    if (isPinned) {
      return unpinConversationAsync();
    } else {
      return pinConversationAsync();
    }
  }, [conversationTopic, pinConversationAsync, unpinConversationAsync]);

  return {
    pinOrUnpinConversationAsync,
  };
}
