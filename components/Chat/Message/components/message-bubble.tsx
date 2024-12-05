import { HStack } from "@design-system/HStack";
import { useAppTheme } from "@theme/useAppTheme";
import { useMemo } from "react";

export const BubbleContainer = ({
  children,
  fromMe,
}: {
  children: React.ReactNode;
  fromMe: boolean;
}) => {
  return (
    <HStack
      style={{
        // ...debugBorder("red"),
        flex: 1,
        ...(fromMe
          ? { justifyContent: "flex-end" }
          : { justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  );
};

type IBubbleContentContainerProps = {
  children: React.ReactNode;
  fromMe: boolean;
  hasNextMessageInSeries: boolean;
};

export const BubbleContentContainer = (args: IBubbleContentContainerProps) => {
  const { children, fromMe, hasNextMessageInSeries } = args;
  const { theme } = useAppTheme();

  const bubbleStyle = useMemo(() => {
    const baseStyle = {
      backgroundColor: fromMe
        ? theme.colors.bubbles.bubble
        : theme.colors.bubbles.received.bubble,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
    };

    if (!hasNextMessageInSeries) {
      return {
        ...baseStyle,
        borderBottomLeftRadius: fromMe
          ? theme.borderRadius.sm
          : theme.spacing["4xs"],
        borderBottomRightRadius: fromMe
          ? theme.spacing["4xs"]
          : theme.borderRadius.sm,
      };
    }

    return baseStyle;
  }, [fromMe, hasNextMessageInSeries, theme]);

  return <HStack style={bubbleStyle}>{children}</HStack>;
};
