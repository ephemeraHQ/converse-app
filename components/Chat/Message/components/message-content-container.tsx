import { HStack } from "@/design-system/HStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
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
          // ...debugBorder("yellow"),
          alignItems: "flex-end",
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
