import { useMutation } from "@tanstack/react-query"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { UploadedRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachments.types"
import { getOrFetchConversationQuery } from "@/features/conversation/queries/conversation.query"
import { sendXmtpConversationMessage } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { IXmtpConversationId, IXmtpRemoteAttachmentInfo } from "@/features/xmtp/xmtp.types"
import { IConversationMessageId } from "../conversation-chat/conversation-message/conversation-message.types"
import { IConversationTopic } from "../conversation.types"

export type ISendMessageContent = {
  text?: string
  remoteAttachments?: UploadedRemoteAttachment[]
}

export type ISendMessageParams = {
  topic: IConversationTopic
  referencedMessageId?: IConversationMessageId
  content: ISendMessageContent
}

function convertConvosUploadedRemoteAttachmentToXmtpRemoteAttachment(
  attachment: UploadedRemoteAttachment,
): IXmtpRemoteAttachmentInfo {
  return {
    ...attachment,
    contentLength: attachment.contentLength.toString(),
    scheme: "https://",
  }
}

export async function sendMessage(args: ISendMessageParams) {
  const { referencedMessageId, content, topic } = args

  if (!content.remoteAttachments?.length && !content.text) {
    throw new Error("Invalid content: Either text or remoteAttachments must be provided")
  }

  const conversation = await getOrFetchConversationQuery({
    topic,
    inboxId: getSafeCurrentSender().inboxId,
    caller: "use-send-message",
  })

  const currentSender = getSafeCurrentSender()

  if (!conversation) {
    throw new Error("Conversation not found when sending message")
  }

  // Handle direct messages (no reply)
  if (!referencedMessageId) {
    // Text-only message
    if (!content.remoteAttachments?.length) {
      return sendXmtpConversationMessage({
        clientInboxId: currentSender.inboxId,
        conversationId: conversation.id as unknown as IXmtpConversationId,
        content: { text: content.text! },
      })
    }

    // Multiple attachments
    if (content.remoteAttachments.length > 1) {
      return sendXmtpConversationMessage({
        clientInboxId: currentSender.inboxId,
        conversationId: conversation.id as unknown as IXmtpConversationId,
        content: {
          multiRemoteAttachment: {
            attachments: content.remoteAttachments.map(
              convertConvosUploadedRemoteAttachmentToXmtpRemoteAttachment,
            ),
          },
        },
      })
    }

    // Single attachment
    return sendXmtpConversationMessage({
      clientInboxId: currentSender.inboxId,
      conversationId: conversation.id as unknown as IXmtpConversationId,
      content: {
        remoteAttachment: convertConvosUploadedRemoteAttachmentToXmtpRemoteAttachment(
          content.remoteAttachments[0],
        ),
      },
    })
  }

  // Handle reply messages
  const replyContent = !content.remoteAttachments?.length
    ? { text: content.text! }
    : content.remoteAttachments.length > 1
      ? {
          multiRemoteAttachment: {
            attachments: content.remoteAttachments.map(
              convertConvosUploadedRemoteAttachmentToXmtpRemoteAttachment,
            ),
          },
        }
      : {
          remoteAttachment: convertConvosUploadedRemoteAttachmentToXmtpRemoteAttachment(
            content.remoteAttachments[0],
          ),
        }

  return sendXmtpConversationMessage({
    clientInboxId: currentSender.inboxId,
    conversationId: conversation.id as unknown as IXmtpConversationId,
    content: {
      reply: {
        reference: referencedMessageId,
        content: replyContent,
      },
    },
  })
}

export function useSendMessage() {
  const mutation = useMutation({
    mutationFn: sendMessage,
    // onMutate: (variables) => {
    //   const currentAccount = getCurrentAccount()!;
    //   const currentUserInboxId = getSafeCurrentSender().inboxId;

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
  })

  return {
    sendMessage: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
  }
}
