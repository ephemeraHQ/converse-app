import React from "react";
import { View, TextStyle, Linking } from "react-native";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "../create-conversation.styles";
import { MessageSectionProps } from "../create-conversation.types";
import { ParsedText } from "@/components/ParsedText/ParsedText";
import * as Sharing from "expo-sharing";
import { useProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
import { getCurrentAccount } from "@/data/store/accountsStore";
import { useProfile } from "@/features/onboarding/hooks/useProfile";

/**
 * Displays a message or error in the create conversation screen
 *
 * @param props.message - Message to display
 * @param props.isError - Whether the message is an error
 */
export function MessageSection({ message, isError }: MessageSectionProps) {
  const { themed, theme } = useAppTheme();
  const { profile } = useProfile();

  const inviteThemStyle: TextStyle = {
    fontSize: 14,
    lineHeight: 18,
    color: theme.colors.text.secondary,
    textAlign: "center",
    height: 18,
    fontFamily: theme.typography.primary.normal,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  };

  if (!message) return null;

  return (
    <View style={themed(createConversationStyles.$messageSection)}>
      <ParsedText
        style={[
          themed(createConversationStyles.$messageText),
          isError && themed(createConversationStyles.$errorText),
        ]}
        parse={[
          {
            pattern: /Invite them?/,
            style: inviteThemStyle,
            onPress: () => {
              Sharing.shareAsync("https://converse.xyz/", {
                mimeType: "text/plain",
                dialogTitle: `${profile.username} on Convos?`,
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
