import { getCurrentAccount } from "@/data/store/accountsStore";
import { getCurrentAccountConversation } from "@/features/conversation/conversation.utils";
import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import {
  addConversationMessageQuery,
  refetchConversationMessages,
} from "@/queries/use-conversation-messages-query";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { getTodayNs } from "@/utils/date";
import { getRandomId } from "@/utils/general";
import { contentTypesPrefixes } from "@/utils/xmtpRN/xmtp-content-types/xmtp-content-types";
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
      const currentUserInboxId = getCurrentAccountInboxId()!;
      const conversation = getCurrentAccountConversation(topic);

      if (conversation) {
        // Add the removal reaction message
        addConversationMessageQuery({
          account: currentAccount,
          topic: conversation.topic,
          message: {
            id: getRandomId() as MessageId,
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
      const currentAccount = getCurrentAccount()!;
      refetchConversationMessages({
        account: currentAccount,
        topic,
        caller: "useRemoveReactionOnMessage mutation onError",
      }).catch(captureErrorWithToast);
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
