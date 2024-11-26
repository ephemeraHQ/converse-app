import { HStack } from "@/design-system/HStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";

export const MessageContentContainer = memo(
  function MessageContentContainer(props: {
    children: React.ReactNode;
    fromMe: boolean;
  }) {
    const { children, fromMe } = props;

    const { theme } = useAppTheme();

    return (
      <HStack
        style={{
          // ...debugBorder("red"),
          flex: 1,
          // alignSelf: fromMe ? "flex-end" : "flex-start",
          alignItems: "flex-end",
          maxWidth: "75%",
          ...(fromMe
            ? { paddingRight: theme.spacing.sm, justifyContent: "flex-end" }
            : { paddingLeft: theme.spacing.sm, justifyContent: "flex-start" }),
        }}
      >
        {children}
      </HStack>
    );
  }
);
