import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useMemo } from "react";
import { ViewStyle } from "react-native";

export type IPinnedConversationMessagePreviewProps = {
  message: DecodedMessageWithCodecsType;
};

export const PinnedConversationMessagePreview = (
  props: IPinnedConversationMessagePreviewProps
) => {
  const { message } = props;

  if (!isTextMessage(message)) {
    throw new Error(
      "Pinned message preview can only be used for text messages"
    );
  }

  const { themed } = useAppTheme();

  const content = useMemo(() => {
    return message.content() as string;
  }, [message]);

  return (
    <HStack style={themed($containerStyle)}>
      <Text numberOfLines={2} preset="smaller">
        {content}
      </Text>
    </HStack>
  );
};

const $containerStyle: ThemedStyle<ViewStyle> = ({
  colors,
  borderRadius,
  borderWidth,
  spacing,
}) => ({
  backgroundColor: colors.background.raised,
  position: "absolute",
  top: 0,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  alignSelf: "center",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
});
