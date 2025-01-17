import React from "react";
import { View } from "react-native";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "../create-conversation.styles";
import { MessageSectionProps } from "../create-conversation.types";

/**
 * Displays a message or error in the create conversation screen
 *
 * @param props.message - Message to display
 * @param props.isError - Whether the message is an error
 */
export function MessageSection({ message, isError }: MessageSectionProps) {
  const { themed } = useAppTheme();

  if (!message) return null;

  return (
    <View style={themed(createConversationStyles.$messageSection)}>
      <Text
        style={[
          themed(createConversationStyles.$messageText),
          isError && themed(createConversationStyles.$errorText),
        ]}
      >
        {message}
      </Text>
    </View>
  );
}
