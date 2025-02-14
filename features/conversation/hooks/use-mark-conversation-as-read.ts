import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { markTopicAsRead } from "@/utils/api/conversation-metadata";
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
      });

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,

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
        updateData: context?.previousData ?? null,
      });
    },
  });

  return {
    markAsReadAsync,
  };
}
