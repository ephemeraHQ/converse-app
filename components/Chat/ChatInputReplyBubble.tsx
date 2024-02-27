import { View, useColorScheme, StyleSheet, Text } from "react-native";

import { XmtpMessage } from "../../data/store/chatStore";
import { isAttachmentMessage } from "../../utils/attachment/helpers";
import { textSecondaryColor } from "../../utils/colors";
import { getRelativeDateTime } from "../../utils/date";
import { isTransactionMessage } from "../../utils/transaction";

export default function ChatMessageReplyBubble({
  replyingToMessage,
  fromMe,
}: {
  replyingToMessage: XmtpMessage;
  fromMe: boolean;
}) {
  const styles = useStyles();

  return (
    <View>
      <Text
        style={[
          styles.messageRepliedTo,
          fromMe ? styles.messageTextMe : undefined,
        ]}
      >
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
    messageRepliedTo: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
    },
    messageTextMe: {
      color: "white",
    },
  });
};
