import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { pinTopic, unpinTopic } from "@/utils/api/topics";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function usePinOrUnpinConversation(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const { mutateAsync: pinOrUnpinConversationAsync } = useMutation({
    mutationFn: () => {
      const currentAccount = getCurrentAccount()!;
      const isPinned = getConversationMetadataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
      })?.isPinned;

      if (isPinned) {
        return unpinTopic({
          account: currentAccount!,
          topic: conversationTopic,
        });
      } else {
        return pinTopic({
          account: currentAccount!,
          topic: conversationTopic,
        });
      }
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousIsPinned = getConversationMetadataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
      })?.isPinned;

      updateConversationMetadataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        updateData: {
          isPinned: !previousIsPinned,
        },
      });
      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        updateData: {
          isPinned: context?.previousIsPinned,
        },
      });
    },
  });

  return {
    pinOrUnpinConversationAsync,
  };
}
