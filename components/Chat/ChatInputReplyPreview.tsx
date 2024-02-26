import {
  View,
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";

import { currentAccount } from "../../data/store/accountsStore";
import { isAttachmentMessage } from "../../utils/attachment/helpers";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getRelativeDateTime } from "../../utils/date";
import { getReadableProfile } from "../../utils/str";
import { isTransactionMessage } from "../../utils/transaction";
import Picto from "../Picto/Picto";
import { MessageToDisplay } from "./ChatMessage";

export default function ChatInputReplyPreview({
  replyingToMessage,
  onDismiss,
}: {
  replyingToMessage: MessageToDisplay;
  onDismiss: () => void;
}) {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const readableProfile = getReadableProfile(
    currentAccount(),
    replyingToMessage?.senderAddress,
    true
  );

  return (
    <View style={styles.replyContainer}>
      <View style={styles.messagePreview}>
        <Text style={[styles.replyToUsername]}>{readableProfile}</Text>
        <Text style={[styles.replyToMessage]}>
          {isAttachmentMessage(replyingToMessage.contentType)
            ? `📎 Media from ${getRelativeDateTime(replyingToMessage.sent)}`
            : isTransactionMessage(replyingToMessage.contentType)
            ? `💸 Transaction from ${getRelativeDateTime(
                replyingToMessage.sent
              )}`
            : replyingToMessage.content || replyingToMessage.contentFallback}
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => {
          onDismiss();
        }}
      >
        <Picto
          picto="xmark"
          color={
            Platform.OS === "android"
              ? textSecondaryColor(colorScheme)
              : "#8E8E93"
          }
          size={Platform.OS === "android" ? 16 : 14}
          style={styles.xmark}
        />
      </TouchableOpacity>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    replyContainer: {
      ...Platform.select({
        default: {},
        android: {},
        web: {},
      }),
      backgroundColor: backgroundColor(colorScheme),
      alignItems: "center",
      flexDirection: "row",
    },
    messagePreview: {
      flexDirection: "column",
      flexShrink: 1,
      flexGrow: 1,
      marginRight: 14,
    },
    replyToUsername: {
      fontSize: 15,
      fontWeight: "bold",
      marginBottom: 4,
      color: textPrimaryColor(colorScheme),
    },
    replyToMessage: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
    },
    xmark: {
      width: 14,
      height: 14,
      marginRight: 13,
    },
  });
};
