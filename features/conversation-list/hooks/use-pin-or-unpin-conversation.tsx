import { getCurrentAccountEthAddress } from "@/features/authentication/account.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { pinTopic, unpinTopic } from "@/utils/api/topics";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export function usePinOrUnpinConversation(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const { mutateAsync: pinConversationAsync } = useMutation({
    mutationFn: () => {
      const currentAccount = getCurrentAccountEthAddress()!;
      return pinTopic({
        account: currentAccount,
        topic: conversationTopic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccountEthAddress()!;
      const previousIsPinned = getConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
      })?.isPinned;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: true },
      });

      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccountEthAddress()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: context?.previousIsPinned },
      });
    },
  });

  const { mutateAsync: unpinConversationAsync } = useMutation({
    mutationFn: () => {
      const currentAccount = getCurrentAccountEthAddress()!;
      return unpinTopic({
        account: currentAccount,
        topic: conversationTopic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccountEthAddress()!;
      const previousIsPinned = getConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
      })?.isPinned;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: false },
      });

      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccountEthAddress()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: conversationTopic,
        updateData: { isPinned: context?.previousIsPinned },
      });
    },
  });

  const pinOrUnpinConversationAsync = useCallback(async () => {
    const currentAccount = getCurrentAccountEthAddress()!;
    const isPinned = getConversationMetadataQueryData({
      account: currentAccount,
      topic: conversationTopic,
    })?.isPinned;

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
