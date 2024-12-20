import { HStack } from "@design-system/HStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";

type IBubbleContainerProps = {
  children: React.ReactNode;
  fromMe: boolean;
  transparent?: boolean;
};

type IBubbleContentContainerProps = {
  children: React.ReactNode;
  fromMe: boolean;
  hasNextMessageInSeries: boolean;
  noPadding?: boolean;
  transparent?: boolean;
};

export const BubbleContainer = memo(function BubbleContainer(
  props: IBubbleContainerProps
) {
  const { children, fromMe } = props;

  return (
    <HStack
      style={{
        ...(fromMe
          ? { justifyContent: "flex-end" }
          : { justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  );
});

export const BubbleContentContainer = memo(function BubbleContentContainer(
  props: IBubbleContentContainerProps
) {
  const { children, fromMe, hasNextMessageInSeries, noPadding, transparent } =
    props;
  const { theme } = useAppTheme();

  const baseStyle = {
    backgroundColor: transparent
      ? "transparent"
      : fromMe
        ? theme.colors.bubbles.bubble
        : theme.colors.bubbles.received.bubble,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: noPadding ? 0 : theme.spacing.xs,
    paddingVertical: noPadding ? 0 : theme.spacing.xxs,
    maxWidth: theme.layout.screen.width * 0.7,
  };

  const style = !hasNextMessageInSeries
    ? {
        ...baseStyle,
        borderBottomLeftRadius: fromMe
          ? theme.borderRadius.sm
          : theme.spacing["4xs"],
        borderBottomRightRadius: fromMe
          ? theme.spacing["4xs"]
          : theme.borderRadius.sm,
      }
    : baseStyle;

  return <HStack style={style}>{children}</HStack>;
});
