import { Button } from "@design-system/Button/Button";
import { translate } from "@i18n";
import { textPrimaryColor } from "@styles/colors";
import { isV3Topic } from "@utils/groupUtils/groupId";
import { useCallback } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

import { useConversationContext } from "../../../utils/conversation";
import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";

type GroupChatPlaceholderProps = {
  messagesCount: number;
  group: GroupWithCodecsType | null | undefined;
  onSend: (payload: { text?: string }) => void;
};

export function GroupChatPlaceholder({
  messagesCount,
  group,
  onSend,
}: GroupChatPlaceholderProps) {
  const topic = useConversationContext("topic");
  const onReadyToFocus = useConversationContext("onReadyToFocus");

  const groupName = group?.name;

  const styles = useStyles();

  const handleSend = useCallback(() => {
    onSend({
      text: "👋",
    });
  }, [onSend]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const onLayout = useCallback(() => {
    if (group && messagesCount === 0) {
      onReadyToFocus();
    }
  }, [group, messagesCount, onReadyToFocus]);

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <View onLayout={onLayout} style={styles.chatPlaceholder}>
        {!group && (
          <View>
            {!topic && <ActivityIndicator style={{ marginBottom: 20 }} />}
            <Text style={styles.chatPlaceholderText}>
              {topic
                ? isV3Topic(topic)
                  ? translate("group_not_found")
                  : translate("conversation_not_found")
                : translate("opening_conversation")}
            </Text>
          </View>
        )}
        {group && messagesCount === 0 && (
          <View>
            <Text style={styles.chatPlaceholderText}>
              {translate("group_placeholder.placeholder_text", {
                groupName,
              })}
            </Text>

            <Button
              variant="fill"
              picto="hand.wave"
              text={translate("say_hi")}
              style={styles.cta}
              onPress={handleSend}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    chatPlaceholder: {
      flex: 1,
      justifyContent: "center",
    },
    chatPlaceholderContent: {
      paddingVertical: 20,
      flex: 1,
    },
    chatPlaceholderText: {
      textAlign: "center",
      fontSize: Platform.OS === "android" ? 16 : 17,
      color: textPrimaryColor(colorScheme),
    },
    cta: {
      alignSelf: "center",
      marginTop: 20,
    },
    activitySpinner: {
      marginBottom: 20,
    },
  });
};
