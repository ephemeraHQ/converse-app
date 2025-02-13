import { getCurrentAccountEthAddress } from "@/features/authentication/account.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { markTopicAsUnread } from "@/utils/api/topics";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useMarkConversationAsUnread(args: {
  topic: ConversationTopic;
}) {
  const { topic } = args;

  const { mutateAsync: markAsUnreadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccountEthAddress()!;
      await markTopicAsUnread({
        account: currentAccount,
        topic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccountEthAddress()!;
      const previousData = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      });

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: {
          markedAsUnread: true,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccountEthAddress()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: context?.previousData ?? null,
      });
    },
  });

  return {
    markAsUnreadAsync,
  };
}
