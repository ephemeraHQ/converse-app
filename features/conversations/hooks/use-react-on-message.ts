import { captureErrorWithToast } from "@/utils/capture-error";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { MessageId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export function useReactOnMessage(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const reactOnMessage = useCallback(
    async (args: { messageId: MessageId; emoji: string }) => {
      const { messageId, emoji } = args;
      try {
        if (!conversation) {
          return;
        }
        await conversation.send({
          reaction: {
            reference: messageId,
            content: emoji,
            schema: "unicode",
            action: "added",
          },
        });
      } catch (error) {
        captureErrorWithToast(error);
      }
    },
    [conversation]
  );

  return reactOnMessage;
}
