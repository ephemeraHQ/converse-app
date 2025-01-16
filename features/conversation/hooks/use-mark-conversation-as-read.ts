import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
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
      const previousData = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        updateData: {
          readUntil: new Date().getTime(),
          markedAsUnread: false,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        updateData: context?.previousData,
      });
    },
  });

  return {
    markAsReadAsync,
  };
}
