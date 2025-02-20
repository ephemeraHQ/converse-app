import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import { markConversationAsRead } from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import { MutationOptions, useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { formatDateForApi } from "@/utils/api/api.utils";

// Define the type for the mutation context
type MarkAsReadContext = {
  previousData: {
    readUntil?: string;
    unread?: boolean;
  } | null;
};

export function getMarkConversationAsReadMutationOptions(args: {
  topic: ConversationTopic;
}): MutationOptions<void, Error, void, MarkAsReadContext> {
  const { topic } = args;

  return {
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

      // Extract only the fields we need for rollback
      return {
        previousData: previousData
          ? {
              readUntil: previousData.readUntil,
              unread: previousData.unread,
            }
          : null,
      };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: context?.previousData ?? {},
      });
    },
  };
}

export function useMarkConversationAsRead(args: { topic: ConversationTopic }) {
  const { mutateAsync: markAsReadAsync } = useMutation(
    getMarkConversationAsReadMutationOptions(args)
  );

  return {
    markAsReadAsync,
  };
}
