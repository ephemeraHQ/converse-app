import { captureErrorWithToast } from "@/utils/capture-error";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { MessageId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export function useRemoveReactionOnMessage(props: {
  conversation: ConversationWithCodecsType;
}) {
  const { conversation } = props;

  const removeReactionFromMessage = useCallback(
    async (args: { messageId: MessageId; emoji: string }) => {
      const { messageId, emoji } = args;
      try {
        await conversation?.send({
          reaction: {
            reference: messageId,
            content: emoji,
            schema: "unicode",
            action: "removed",
          },
        });
      } catch (error) {
        captureErrorWithToast(error);
      }
    },
    [conversation]
  );

  return removeReactionFromMessage;
}
