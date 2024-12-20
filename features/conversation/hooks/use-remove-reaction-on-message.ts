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
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationTopic,
  MessageDeliveryStatus,
  MessageId,
  ReactionContent,
} from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export function useRemoveReactionOnMessage(props: {
  topic: ConversationTopic;
}) {
  const { topic } = props;

  const { mutateAsync: removeReactionMutationAsync } = useMutation({
    mutationFn: async (variables: { reaction: ReactionContent }) => {
      const { reaction } = variables;
      const conversation = getCurrentAccountConversation(topic);
      if (!conversation) {
        throw new Error("Conversation not found when removing reaction");
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
        // Add the removal reaction message
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

  const removeReactionFromMessage = useCallback(
    async (args: { messageId: MessageId; emoji: string }) => {
      try {
        await removeReactionMutationAsync({
          reaction: {
            reference: args.messageId,
            content: args.emoji,
            schema: "unicode",
            action: "removed",
          },
        });
      } catch (error) {
        captureErrorWithToast(error);
      }
    },
    [removeReactionMutationAsync]
  );

  return removeReactionFromMessage;
}
