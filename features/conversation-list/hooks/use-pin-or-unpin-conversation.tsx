import { useCurrentAccount } from "@/data/store/accountsStore";
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

  const currentAccount = useCurrentAccount();

  const { mutateAsync: pinOrUnpinConversationAsync } = useMutation({
    mutationFn: () => {
      const isPinned = getConversationDataQueryData({
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
      const previousIsPinned = getConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
      })?.isPinned;

      setConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        data: {
          isPinned: !previousIsPinned,
        },
      });
      return { previousIsPinned };
    },
    onError: (error, _, context) => {
      captureErrorWithToast(error);
      setConversationDataQueryData({
        account: currentAccount!,
        topic: conversationTopic,
        data: {
          isPinned: context?.previousIsPinned,
        },
      });
    },
  });

  return {
    pinOrUnpinConversationAsync: pinOrUnpinConversationAsync,
  };
}
