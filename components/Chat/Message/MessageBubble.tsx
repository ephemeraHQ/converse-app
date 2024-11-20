import { useMessageContextStoreContext } from "@components/Chat/Message/messageContextStore";
import ClickableText from "@components/ClickableText";
import { HStack } from "@design-system/HStack";
import { useAppTheme } from "@theme/useAppTheme";
import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

type MessageBubbleProps = {
  content?: string;
};

export const MessageBubble = ({ content }: MessageBubbleProps) => {
  const styles = useStyles();

  const { theme } = useAppTheme();

  const fromMe = useMessageContextStoreContext((state) => state.fromMe);
  const hasNextMessageInSeries = useMessageContextStoreContext(
    (state) => state.hasNextMessageInSeries
  );
  const showDateChange = useMessageContextStoreContext(
    (state) => state.showDateChange
  );
  const hasPreviousMessageInSeries = useMessageContextStoreContext(
    (state) => state.hasPreviousMessageInSeries
  );

  return (
    <HStack
      style={[
        // debugBorder(),
        styles.container,
        fromMe && styles.containerMe,
        {
          columnGap: theme.spacing.xxs,
        },
      ]}
    >
      <HStack
        style={[
          //   debugBorder("red"),
          styles.messageBubble,
          fromMe && styles.messageBubbleMe,
          !hasNextMessageInSeries && styles.messageBubbleTail,
          fromMe &&
            (!hasNextMessageInSeries ||
              showDateChange ||
              hasPreviousMessageInSeries) &&
            styles.messageBubbleTailMe,
        ]}
      >
        <ClickableText
          style={[styles.messageText, fromMe && styles.messageTextMe]}
        >
          {content}
        </ClickableText>
      </HStack>
    </HStack>
  );
};

const useStyles = () => {
  const { theme } = useAppTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignSelf: "flex-start",
          alignItems: "flex-end",
          // maxWidth: "85%", // Not sure
        },
        containerMe: {
          alignSelf: "flex-end",
        },
        messageBubble: {
          backgroundColor: theme.colors.bubbles.received.bubble,
          borderRadius: theme.borderRadius.sm,
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xxs,
        },
        messageBubbleMe: {
          backgroundColor: theme.colors.bubbles.bubble,
        },
        messageBubbleTail: {
          borderBottomLeftRadius: theme.spacing["4xs"],
        },
        messageBubbleTailMe: {
          borderBottomLeftRadius: theme.spacing.sm,
          borderBottomRightRadius: theme.spacing["4xs"],
        },
        messageText: {
          color: theme.colors.text.primary,
        },
        messageTextMe: {
          color: theme.colors.text.inverted.primary,
        },
        allEmojisAndMaxThree: {
          fontSize: 64,
          paddingHorizontal: 0,
        },
      }),
    [theme]
  );
};
