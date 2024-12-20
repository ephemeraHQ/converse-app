import { ClickableText } from "@components/ClickableText";
import { useAppTheme } from "@theme/useAppTheme";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { memo } from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";

type IMessageTextProps = {
  children: React.ReactNode;
  inverted?: boolean;
  isBigEmoji?: boolean;
};

export const MessageText = memo(function MessageText(args: IMessageTextProps) {
  const { children, inverted, isBigEmoji } = args;

  const { theme } = useAppTheme();

  return (
    <ClickableText
      style={{
        color: inverted
          ? theme.colors.text.inverted.primary
          : theme.colors.text.primary,
        ...(isBigEmoji && textSizeStyles.xxl),
      }}
    >
      {children}
    </ClickableText>
  );
});
