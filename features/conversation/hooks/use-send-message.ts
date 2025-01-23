import { getCurrentAccount } from "@/data/store/accountsStore";
import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { fetchConversationMessageQuery } from "@/queries/useConversationMessage";
import {
  addConversationMessageQuery,
  refetchConversationMessages,
  replaceOptimisticMessageWithReal,
} from "@/queries/use-conversation-messages-query";
import { captureErrorWithToast } from "@/utils/capture-error";
import { getTodayNs } from "@/utils/date";
import { getRandomId } from "@/utils/general";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
import { useMutation } from "@tanstack/react-query";
import {
  DecodedMessage,
  MessageDeliveryStatus,
  MessageId,
  RemoteAttachmentContent,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export type ISendMessageParams = {
  referencedMessageId?: MessageId;
  content:
    | { text: string; remoteAttachment?: RemoteAttachmentContent }
    | { text?: string; remoteAttachment: RemoteAttachmentContent };
};

export function sendMessage(args: {
  conversation: ConversationWithCodecsType;
  params: ISendMessageParams;
}) {
  const { conversation, params } = args;

  const { referencedMessageId, content } = params;

  if (referencedMessageId) {
    return conversation.send({
      reply: {
        reference: referencedMessageId,
        content: content.remoteAttachment
          ? { remoteAttachment: content.remoteAttachment }
          : { text: content.text },
      },
    });
  }

  return conversation.send(
    content.remoteAttachment
      ? { remoteAttachment: content.remoteAttachment }
      : { text: content.text! }
  );
}

export function useSendMessage(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const { mutateAsync: sendMessageMutationAsync } = useMutation({
    mutationFn: (variables: ISendMessageParams) => {
      return sendMessage({ conversation, params: variables });
    },
    onMutate: (variables) => {
      const currentAccount = getCurrentAccount()!;
      const currentUserInboxId = getCurrentAccountInboxId()!;

      // For now, we only do optimistic updates for simple text messages
      // And if we like this, we'll implement the rest of content types
      if (variables.content.text && !variables.referencedMessageId) {
        const generatedMessageId = getRandomId();

        const textMessage: DecodedMessage<TextCodec> = {
          id: generatedMessageId as MessageId,
          // @ts-expect-error helping the list keep a reference to the optimistic message
          tempOptimisticId: generatedMessageId,
          contentTypeId: variables.content.text
            ? contentTypesPrefixes.text
            : contentTypesPrefixes.remoteAttachment,
          sentNs: getTodayNs(),
          fallback: "new-message",
          deliveryStatus: "sending" as MessageDeliveryStatus, // NOT GOOD but tmp
          topic: conversation.topic,
          senderInboxId: currentUserInboxId,
          nativeContent: {},
          content: () => {
            return variables.content.text!;
          },
        };

        addConversationMessageQuery({
          account: currentAccount,
          topic: conversation.topic,
          message: textMessage,
        });

        return {
          generatedMessageId,
        };
      }
    },
    onSuccess: async (messageId, _, context) => {
      if (context && messageId) {
        // The SDK only returns the messageId
        const message = await fetchConversationMessageQuery({
          account: getCurrentAccount()!,
          messageId,
        });

        if (!message) {
          throw new Error("Message not found");
        }

        if (message) {
          replaceOptimisticMessageWithReal({
            tempId: context.generatedMessageId,
            topic: conversation.topic,
            account: getCurrentAccount()!,
            realMessage: message,
          });
        }
      }
    },
    onError: (error) => {
      const currentAccount = getCurrentAccount()!;
      refetchConversationMessages({
        account: currentAccount,
        topic: conversation.topic,
      }).catch(captureErrorWithToast);
    },
  });

  return useCallback(
    async (args: ISendMessageParams) => {
      try {
        if (!conversation) {
          throw new Error("Conversation not found when sending message");
        }
        await sendMessageMutationAsync(args);
      } catch (error) {
        captureErrorWithToast(error);
      }
    },
    [sendMessageMutationAsync, conversation]
  );
}
