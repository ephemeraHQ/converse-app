import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  getConversationDataQueryData,
  updateConversationDataQueryData,
} from "@/queries/conversation-data-query";
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
      const isPinned = getConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        context: "usePinOrUnpinConversation",
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
      const previousIsPinned = getConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        context: "usePinOrUnpinConversation",
      })?.isPinned;

      updateConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        context: "usePinOrUnpinConversation",
        updateData: {
          isPinned: !previousIsPinned,
        },
      });
      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        context: "usePinOrUnpinConversation",
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
