import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import { markConversationAsRead } from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { formatDateForApi } from "@/utils/api/api.utils";

export function useMarkConversationAsRead(args: { topic: ConversationTopic }) {
  const { topic } = args;

  const { mutateAsync: markAsReadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      const readUntil = formatDateForApi(new Date());

      await markConversationAsRead({
        account: currentAccount,
        topic,
        readUntil,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const readUntil = formatDateForApi(new Date());

      const previousData = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      });

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: {
          readUntil,
          unread: false,
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
