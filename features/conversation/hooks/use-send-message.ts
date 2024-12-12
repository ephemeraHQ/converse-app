import { getCurrentAccount } from "@/data/store/accountsStore";
import { refetchConversationMessages } from "@/queries/useConversationMessages";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useMutation } from "@tanstack/react-query";
import { MessageId, RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export type ISendMessageParams = {
  content: {
    text?: string;
    remoteAttachment?: RemoteAttachmentContent;
  };
  referencedMessageId?: MessageId;
} & (
  | { content: { text: string; remoteAttachment?: RemoteAttachmentContent } }
  | { content: { text?: string; remoteAttachment: RemoteAttachmentContent } }
);

export function useSendMessage(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const { mutateAsync: sendMessageMutationAsync } = useMutation({
    mutationFn: async (variables: ISendMessageParams) => {
      const { referencedMessageId, content } = variables;

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
    },
    // WIP
    // onMutate: (variables) => {
    //   const currentAccount = getCurrentAccount()!;
    //   const currentUserInboxId = getCurrentUserAccountInboxId()!;

    //   // For now only optimistic message for simple text message
    //   if (variables.content.text && !variables.referencedMessageId) {
    //     const generatedMessageId = getRandomId();

    //     const textMessage: DecodedMessage<TextCodec> = {
    //       id: generatedMessageId,
    //       client: conversation.client,
    //       contentTypeId: variables.content.text
    //         ? contentTypesPrefixes.text
    //         : contentTypesPrefixes.remoteAttachment,
    //       sentNs: getTodayNs(),
    //       fallback: "new-message",
    //       deliveryStatus: MessageDeliveryStatus.PUBLISHED,
    //       topic: conversation.topic,
    //       senderAddress: currentUserInboxId,
    //       nativeContent: {},
    //       content: () => {
    //         return variables.content.text!;
    //       },
    //     };

    //     addConversationMessage({
    //       account: currentAccount,
    //       topic: conversation.topic,
    //       message: textMessage,
    //       // isOptimistic: true,
    //     });

    //     return {
    //       generatedMessageId,
    //     };
    //   }
    // },
    // WIP
    // onSuccess: (messageId, _, context) => {
    //   if (context && messageId) {
    //     updateConversationMessagesOptimisticMessages(
    //       context.generatedMessageId,
    //       messageId
    //     );
    //   }
    // },
    onError: (error) => {
      captureError(error);
      const currentAccount = getCurrentAccount()!;
      refetchConversationMessages(currentAccount, conversation.topic).catch(
        captureErrorWithToast
      );
    },
  });

  const sendMessage = useCallback(
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

  return sendMessage;
}
