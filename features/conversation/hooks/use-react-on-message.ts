import {
  getCurrentAccount,
  getSafeCurrentSender,
} from "@/features/multi-inbox/multi-inbox.store";
import { getConversationForCurrentAccount } from "@/features/conversation/utils/get-conversation-for-current-account";
import {
  addConversationMessageQuery,
  refetchConversationMessages,
} from "@/queries/conversation-messages-query";
import { captureErrorWithToast } from "@/utils/capture-error";
import { getTodayNs } from "@/utils/date";
import { getRandomId } from "@/utils/general";
import { Haptics } from "@/utils/haptics";
import { contentTypesPrefixes } from "@/utils/xmtpRN/xmtp-content-types/xmtp-content-types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationTopic,
  MessageDeliveryStatus,
  MessageId,
  ReactionContent,
} from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export function useReactOnMessage(props: { topic: ConversationTopic }) {
  const { topic } = props;

  const { mutateAsync: reactOnMessageMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: ReactionContent }) => {
      const { reaction } = variables;
      const conversation = getConversationForCurrentAccount(topic);
      if (!conversation) {
        throw new Error("Conversation not found when reacting on message");
      }
      await conversation.send({
        reaction,
      });
    },
    onMutate: (variables) => {
      const {
        ethereumAddress: currentEthereumAddress,
        inboxId: currentInboxId,
      } = getSafeCurrentSender();
      const conversation = getConversationForCurrentAccount(topic);

      if (conversation) {
        // Add the reaction to the message
        addConversationMessageQuery({
          account: currentEthereumAddress,
          topic: conversation.topic,
          message: {
            id: getRandomId() as MessageId,
            contentTypeId: contentTypesPrefixes.reaction,
            sentNs: getTodayNs(),
            fallback: variables.reaction.content,
            deliveryStatus: MessageDeliveryStatus.PUBLISHED,
            topic: conversation.topic,
            senderInboxId: currentInboxId,
            nativeContent: {},
            content: () => {
              return variables.reaction;
            },
          },
        });
      }
    },
    onError: (error) => {
      const currentAccount = getCurrentAccount()!;
      refetchConversationMessages({
        account: currentAccount,
        topic,
        caller: "useReactOnMessage mutation onError",
      }).catch(captureErrorWithToast);
    },
  });

  const reactOnMessage = useCallback(
    async (args: { messageId: MessageId; emoji: string }) => {
      try {
        Haptics.softImpactAsync();
        await reactOnMessageMutationAsync({
          reaction: {
            reference: args.messageId,
            content: args.emoji,
            schema: "unicode",
            action: "added",
          },
        });
      } catch (error) {
        captureErrorWithToast(error);
      }
    },
    [reactOnMessageMutationAsync]
  );

  return reactOnMessage;
}
