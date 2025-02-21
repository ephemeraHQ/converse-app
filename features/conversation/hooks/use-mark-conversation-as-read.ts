import { MutationOptions, useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { getCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store";
import { markConversationAsRead } from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
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
    mutationKey: ["markConversationAsRead", topic],
    mutationFn: async () => {
      const currentAccount = getCurrentSenderEthAddress()!;
      const readUntil = formatDateForApi(new Date());

      await markConversationAsRead({
        account: currentAccount,
        topic,
        readUntil,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentSenderEthAddress()!;
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
      const currentAccount = getCurrentSenderEthAddress()!;
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
    getMarkConversationAsReadMutationOptions(args),
  );

  return {
    markAsReadAsync,
  };
}
