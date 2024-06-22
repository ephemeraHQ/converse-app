import { View, StyleSheet, Text } from "react-native";

import { XmtpMessage } from "../../../data/store/chatStore";
import { isAttachmentMessage } from "../../../utils/attachment/helpers";
import { getRelativeDateTime } from "../../../utils/date";
import { isTransactionMessage } from "../../../utils/transaction";

export default function ChatInputReplyBubble({
  replyingToMessage,
  fromMe,
}: {
  replyingToMessage: XmtpMessage;
  fromMe: boolean;
}) {
  const styles = useStyles();

  return (
    <View>
      <Text style={styles.messageRepliedTo}>
        {isAttachmentMessage(replyingToMessage.contentType)
          ? `📎 Media from ${getRelativeDateTime(replyingToMessage.sent)}`
          : isTransactionMessage(replyingToMessage.contentType)
          ? `💸 Transaction from ${getRelativeDateTime(replyingToMessage.sent)}`
          : replyingToMessage.content || replyingToMessage.contentFallback}
      </Text>
    </View>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    messageRepliedTo: {
      fontSize: 16,
      color: "white",
    },
  });
};
