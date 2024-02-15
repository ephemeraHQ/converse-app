import {
  View,
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";

import { currentAccount } from "../../data/store/accountsStore";
import { backgroundColor, textSecondaryColor } from "../../utils/colors";
import { getReadableProfile } from "../../utils/str";
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
        <Text>{readableProfile}</Text>
        <Text>
          {replyingToMessage.content || replyingToMessage.contentFallback}
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => {
          console.log("yolo");
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
      flexGrow: 1,
      marginRight: 10,
    },
    xmark: {
      ...Platform.select({
        default: { width: 14, height: 14 },
      }),
      marginRight: 13,
    },
  });
};
