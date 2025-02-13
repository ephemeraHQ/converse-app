import { useCurrentAccount } from "@/features/authentication/account.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useRestoreConversation(args: { topic: ConversationTopic }) {
  const { topic } = args;
  const currentAccount = useCurrentAccount()!;

  const { mutateAsync: restoreConversationAsync } = useMutation({
    mutationFn: () => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { isDeleted: false },
      });
      return Promise.resolve();
    },
    onMutate: () => {
      const previousIsDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      })?.isDeleted;

      return { previousIsDeleted };
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { isDeleted: context?.previousIsDeleted },
      });
    },
  });

  return {
    restoreConversationAsync,
  };
}
