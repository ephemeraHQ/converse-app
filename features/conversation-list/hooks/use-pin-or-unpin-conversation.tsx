import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  getConversationDataQueryData,
  setConversationDataQueryData,
} from "@/queries/use-conversation-data-query";
import { pinTopic, unpinTopic } from "@/utils/api/topics";
import { captureErrorWithToast } from "@/utils/capture-error";
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

      setConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        context: "usePinOrUnpinConversation",
        data: {
          isPinned: !previousIsPinned,
        },
      });
      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      captureErrorWithToast(error);
      setConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        context: "usePinOrUnpinConversation",
        data: {
          isPinned: context?.previousIsPinned,
        },
      });
    },
  });

  return {
    pinOrUnpinConversationAsync,
  };
}
