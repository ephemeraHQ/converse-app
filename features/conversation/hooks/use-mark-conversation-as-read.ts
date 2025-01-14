import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  getConversationDataQueryData,
  setConversationDataQueryData,
} from "@/queries/conversation-data-query";
import { markTopicAsRead } from "@/utils/api/topics";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useMarkConversationAsRead(args: { topic: ConversationTopic }) {
  const { topic } = args;

  const { mutateAsync: markAsReadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      await markTopicAsRead({
        account: currentAccount,
        topic,
        readUntil: new Date().getTime(),
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
          readUntil: new Date().getTime(),
          markedAsUnread: false,
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
    markAsReadAsync,
  };
}
