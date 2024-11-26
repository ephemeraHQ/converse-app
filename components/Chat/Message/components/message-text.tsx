import { ClickableText } from "@components/ClickableText";
import { useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";

type IMessageTextProps = {
  children: React.ReactNode;
  inverted?: boolean;
};

export const MessageText = memo(function MessageText(args: IMessageTextProps) {
  const { children, inverted } = args;

  const { theme } = useAppTheme();

  return (
    <ClickableText
      style={{
        color: inverted
          ? theme.colors.text.inverted.primary
          : theme.colors.text.primary,
      }}
    >
      {children}
    </ClickableText>
  );
});
