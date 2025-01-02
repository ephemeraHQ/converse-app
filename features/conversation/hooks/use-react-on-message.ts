import { getCurrentAccount } from "@/data/store/accountsStore";
import { getCurrentAccountConversation } from "@/features/conversation/conversation.utils";
import { getCurrentUserAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import {
  addConversationMessage,
  refetchConversationMessages,
} from "@/queries/useConversationMessages";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { getTodayNs } from "@/utils/date";
import { getRandomId } from "@/utils/general";
import { Haptics } from "@/utils/haptics";
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
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
      const conversation = getCurrentAccountConversation(topic);
      if (!conversation) {
        throw new Error("Conversation not found when reacting on message");
      }
      await conversation.send({
        reaction,
      });
    },
    onMutate: (variables) => {
      const currentAccount = getCurrentAccount()!;
      const currentUserInboxId = getCurrentUserAccountInboxId()!;
      const conversation = getCurrentAccountConversation(topic);

      if (conversation) {
        // Add the reaction to the message
        addConversationMessage({
          account: currentAccount,
          topic: conversation.topic,
          message: {
            id: getRandomId() as MessageId,
            client: conversation.client,
            contentTypeId: contentTypesPrefixes.reaction,
            sentNs: getTodayNs(),
            fallback: variables.reaction.content,
            deliveryStatus: MessageDeliveryStatus.PUBLISHED,
            topic: conversation.topic,
            senderInboxId: currentUserInboxId,
            nativeContent: {},
            content: () => {
              return variables.reaction;
            },
          },
        });
      }
    },
    onError: (error) => {
      captureError(error);
      const currentAccount = getCurrentAccount()!;
      refetchConversationMessages(currentAccount, topic).catch(
        captureErrorWithToast
      );
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
