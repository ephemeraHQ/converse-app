import { Button } from "@design-system/Button/Button";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { useAppTheme } from "@theme/useAppTheme";
import { isV3Topic } from "@utils/groupUtils/groupId";
import { useCallback } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { useConversationGroupContext } from "../../../features/conversation/conversation-group-context";
import { useConversationContext } from "../../../features/conversation/conversation-context";
import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";

export function GroupChatPlaceholder() {
  const { theme } = useAppTheme();

  const topic = useConversationContext("topic");
  const onReadyToFocus = useConversationContext("onReadyToFocus");
  const numberOfMessages = useConversationContext("numberOfMessages");
  const sendMessage = useConversationContext("sendMessage");
  const conversationNotFound = useConversationContext("conversationNotFound");
  const groupName = useConversationGroupContext("groupName");

  const handleSend = useCallback(() => {
    sendMessage({
      text: "👋",
    });
  }, [sendMessage]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const onLayout = useCallback(() => {
    if (!conversationNotFound && numberOfMessages === 0) {
      onReadyToFocus();
    }
  }, [conversationNotFound, numberOfMessages, onReadyToFocus]);

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <VStack
        onLayout={onLayout}
        style={{
          flex: 1,
          justifyContent: "center",
        }}
      >
        {conversationNotFound && (
          <VStack>
            {!topic && (
              <ActivityIndicator style={{ marginBottom: theme.spacing.md }} />
            )}
            <Text
              style={{
                textAlign: "center",
              }}
            >
              {topic
                ? isV3Topic(topic)
                  ? translate("group_not_found")
                  : translate("conversation_not_found")
                : translate("opening_conversation")}
            </Text>
          </VStack>
        )}
        {numberOfMessages === 0 && (
          <VStack>
            <Text
              style={{
                textAlign: "center",
              }}
            >
              {translate("group_placeholder.placeholder_text", {
                groupName,
              })}
            </Text>

            <Button
              variant="fill"
              picto="hand.wave"
              text={translate("say_hi")}
              style={{
                alignSelf: "center",
                marginTop: theme.spacing.md,
              }}
              onPress={handleSend}
            />
          </VStack>
        )}
      </VStack>
    </TouchableWithoutFeedback>
  );
}
