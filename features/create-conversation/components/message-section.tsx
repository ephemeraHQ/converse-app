import React from "react";
import { View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "../create-conversation.styles";
import { MessageSectionProps } from "../create-conversation.types";
import { ParsedText } from "@/components/ParsedText/ParsedText";
import * as Sharing from "expo-sharing";
import { useProfile } from "@/features/onboarding/hooks/useProfile";

/**
 * Displays a message in the create conversation screen
 *
 * @param props.message - Message to display
 * @param props.isError - Whether the message is an error
 */
export function MessageSection({ message }: MessageSectionProps) {
  const { themed } = useAppTheme();
  const { profile } = useProfile();

  if (!message) return null;

  return (
    <View style={themed(createConversationStyles.$messageSection)}>
      <ParsedText
        style={themed(createConversationStyles.$messageText)}
        parse={[
          {
            pattern: /Invite them?/,
            style: themed(createConversationStyles.$inviteThemStyle),
            onPress: () => {
              Sharing.shareAsync("https://converse.xyz/", {
                mimeType: "text/plain",
                dialogTitle: `${profile.username} on Convos`,
              });
            },
          },
        ]}
      >
        {message}
      </ParsedText>
    </View>
  );
}
