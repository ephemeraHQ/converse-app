import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import { useCurrentSenderEthAddress } from "@/features/multi-inbox/multi-inbox.store";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useRestoreConversation(args: { topic: ConversationTopic }) {
  const { topic } = args;
  const currentAccount = useCurrentSenderEthAddress()!;

  const { mutateAsync: restoreConversationAsync } = useMutation({
    mutationFn: () => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { deleted: false },
      });
      return Promise.resolve();
    },
    onMutate: () => {
      const previousDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      })?.deleted;

      return { previousDeleted };
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { deleted: context?.previousDeleted },
      });
    },
  });

  return {
    restoreConversationAsync,
  };
}
