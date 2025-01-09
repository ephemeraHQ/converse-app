import { getCurrentInboxId } from "@/data/store/accountsStore";
import { fetchMessageByIdQuery } from "@/queries/useConversationMessage";
import {
  addConversationMessage,
  refetchConversationMessages,
  replaceOptimisticMessageWithReal,
} from "@/queries/useConversationMessages";
import { getCurrentAddress } from "@/screens/Onboarding/OnboardingUserProfileScreen";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
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
    mutationFn: (variables: ISendMessageParams) =>
      sendMessage({ conversation, params: variables }),
    // WIP
    onMutate: (variables) => {
      const currentInboxId = getCurrentInboxId()!;

      // For now only optimistic message for simple text message
      if (variables.content.text && !variables.referencedMessageId) {
        const generatedMessageId = getRandomId();

        const textMessage: DecodedMessage<TextCodec> = {
          id: generatedMessageId as MessageId,
          client: conversation.client,
          contentTypeId: variables.content.text
            ? contentTypesPrefixes.text
            : contentTypesPrefixes.remoteAttachment,
          sentNs: getTodayNs(),
          fallback: "new-message",
          deliveryStatus: "sending" as MessageDeliveryStatus, // NOT GOOD but tmp
          topic: conversation.topic,
          senderInboxId: currentInboxId,
          nativeContent: {},
          content: () => {
            return variables.content.text!;
          },
        };

        addConversationMessage({
          inboxId: currentInboxId,
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
        const message = await fetchMessageByIdQuery({
          inboxId: getCurrentInboxId()!,
          account: getCurrentAddress()!,
          messageId,
        });

        if (!message) {
          throw new Error("Message not found");
        }

        if (message) {
          replaceOptimisticMessageWithReal({
            tempId: context.generatedMessageId,
            topic: conversation.topic,
            inboxId: getCurrentInboxId()!,
            message,
          });
        }
      }
    },
    onError: (error) => {
      captureError(error);
      const currentInboxId = getCurrentInboxId()!;
      refetchConversationMessages({
        inboxId: currentInboxId,
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
