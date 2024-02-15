import { View, useColorScheme, StyleSheet, Text } from "react-native";

import { XmtpMessage } from "../../data/store/chatStore";
import { isAttachmentMessage } from "../../utils/attachment/helpers";
import { textSecondaryColor } from "../../utils/colors";
import { getRelativeDateTime } from "../../utils/date";
import { isTransactionMessage } from "../../utils/transaction";

export default function ChatMessageReplyBubble({
  replyingToMessage,
}: {
  replyingToMessage: XmtpMessage;
}) {
  const styles = useStyles();

  return (
    <View>
      <Text style={[styles.replyToMessage]}>
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
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    replyToMessage: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
    },
  });
};
