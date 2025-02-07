import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import {
  addConversationMessageQuery,
  refetchConversationMessages,
  replaceOptimisticMessageWithReal,
} from "@/queries/conversation-messages-query";
import { fetchConversationMessageQuery } from "@/queries/useConversationMessage";
import { getOrFetchConversation } from "@/queries/conversation-query";
import { captureErrorWithToast } from "@/utils/capture-error";
import { getTodayNs } from "@/utils/date";
import { getRandomId } from "@/utils/general";
import { contentTypesPrefixes } from "@/utils/xmtpRN/xmtp-content-types/xmtp-content-types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationTopic,
  DecodedMessage,
  MessageDeliveryStatus,
  MessageId,
  RemoteAttachmentContent,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export type ISendMessageParams = {
  topic: ConversationTopic;
  referencedMessageId?: MessageId;
  content:
    | { text: string; remoteAttachment?: RemoteAttachmentContent }
    | { text?: string; remoteAttachment: RemoteAttachmentContent };
};

export async function sendMessage(args: ISendMessageParams) {
  const { referencedMessageId, content, topic } = args;
  const conversation = await getOrFetchConversation({
    topic,
    account: getCurrentAccount()!,
    caller: "use-send-message#sendMessage",
  });

  if (!conversation) {
    throw new Error("Conversation not found when sending message");
  }

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

export function useSendMessage() {
  const { mutateAsync, error, isError } = useMutation({
    mutationFn: (variables: ISendMessageParams) => {
      return sendMessage(variables);
    },
    // onMutate: (variables) => {
    //   const currentAccount = getCurrentAccount()!;
    //   const currentUserInboxId = getCurrentAccountInboxId()!;

    //   // For now, we only do optimistic updates for simple text messages
    //   // And if we like this, we'll implement the rest of content types
    //   if (variables.content.text && !variables.referencedMessageId) {
    //     const generatedMessageId = getRandomId();

    //     const textMessage: DecodedMessage<TextCodec> = {
    //       id: generatedMessageId as MessageId,
    //       // @ts-expect-error helping the list keep a reference to the optimistic message
    //       tempOptimisticId: generatedMessageId,
    //       contentTypeId: variables.content.text
    //         ? contentTypesPrefixes.text
    //         : contentTypesPrefixes.remoteAttachment,
    //       sentNs: getTodayNs(),
    //       fallback: "new-message",
    //       deliveryStatus: "sending" as MessageDeliveryStatus, // NOT GOOD but tmp
    //       topic: variables.topic,
    //       senderInboxId: currentUserInboxId,
    //       nativeContent: {},
    //       content: () => {
    //         return variables.content.text!;
    //       },
    //     };

    //     addConversationMessageQuery({
    //       account: currentAccount,
    //       topic: variables.topic,
    //       message: textMessage,
    //     });

    //     return {
    //       generatedMessageId,
    //     };
    //   }
    // },
    // onSuccess: async (messageId, variables, context) => {
    //   if (context && messageId) {
    //     // The SDK only returns the messageId
    //     const message = await fetchConversationMessageQuery({
    //       account: getCurrentAccount()!,
    //       messageId,
    //     });

    //     if (!message) {
    //       throw new Error("Message not found");
    //     }

    //     if (message) {
    //       replaceOptimisticMessageWithReal({
    //         tempId: context.generatedMessageId,
    //         topic: variables.topic,
    //         account: getCurrentAccount()!,
    //         realMessage: message,
    //       });
    //     }
    //   }
    // },
    // onError: (error, variables) => {
    //   const currentAccount = getCurrentAccount()!;
    //   refetchConversationMessages({
    //     account: currentAccount,
    //     topic: variables.topic,
    //     caller: "useSendMessage#onError",
    //   }).catch(captureErrorWithToast);
    // },
  });

  const sendMessageMutation = useCallback(
    async (args: ISendMessageParams) => {
      try {
        await mutateAsync(args);
      } catch (error) {
        captureErrorWithToast(error);
      }
    },
    [mutateAsync]
  );

  return {
    sendMessage: sendMessageMutation,
    error,
    isError,
  };
}
