import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  getConversationDataQueryData,
  setConversationDataQueryData,
} from "@/queries/conversation-data-query";
import { markTopicAsUnread } from "@/utils/api/topics";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useMarkConversationAsUnread(args: {
  topic: ConversationTopic;
}) {
  const { topic } = args;

  const { mutateAsync: markAsUnreadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      await markTopicAsUnread({
        account: currentAccount,
        topic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousData = getConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: {
          markedAsUnread: true,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: context?.previousData,
      });
    },
  });

  return {
    markAsUnreadAsync,
  };
}
