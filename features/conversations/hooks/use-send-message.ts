import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
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

  const sendMessage = useCallback(
    async ({ referencedMessageId, content }: ISendMessageParams) => {
      if (!conversation) {
        return;
      }

      if (referencedMessageId) {
        if (content.remoteAttachment) {
          await conversation.send({
            reply: {
              reference: referencedMessageId,
              content: { remoteAttachment: content.remoteAttachment },
            },
          });
        }
        if (content.text) {
          await conversation.send({
            reply: {
              reference: referencedMessageId,
              content: { text: content.text },
            },
          });
        }
        return;
      }

      if (content.remoteAttachment) {
        await conversation.send({
          remoteAttachment: content.remoteAttachment,
        });
      }

      if (content.text) {
        await conversation?.send({
          text: content.text,
        });
      }
    },
    [conversation]
  );

  return sendMessage;
}
