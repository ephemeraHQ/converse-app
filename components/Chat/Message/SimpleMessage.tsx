import { MessageSenderAvatarDumb } from "@components/Chat/Message/MessageSenderAvatar";
import { useMessageContextStoreContext } from "@components/Chat/Message/messageContextStore";
import ClickableText from "@components/ClickableText";
import { HStack } from "@design-system/HStack";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

type SimpleMessageProps = {
  content?: string;
};

export const SimpleMessage = ({ content }: SimpleMessageProps) => {
  const styles = useStyles();

  const { theme } = useAppTheme();

  const fromMe = useMessageContextStoreContext((state) => state.fromMe);
  const hasNextMessageInSeries = useMessageContextStoreContext(
    (state) => state.hasNextMessageInSeries
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
      <MessageAvatarWrapper />
      <HStack
        style={[
          //   debugBorder("red"),
          styles.messageBubble,
          fromMe && styles.messageBubbleMe,
          !hasNextMessageInSeries && styles.messageBubbleTail,
          fromMe && !hasNextMessageInSeries && styles.messageBubbleTailMe,
        ]}
      >
        <ClickableText
          style={
            [
              // styles.messageText,
              // fromMe ? styles.messageTextMe : undefined,
            ]
          }
        >
          {content}
        </ClickableText>
      </HStack>
    </HStack>
  );
};

export const MessageAvatarWrapper = memo(function MessageAvatarWrapper() {
  const { theme } = useAppTheme();

  const hasNextMessageInSeries = useMessageContextStoreContext(
    (state) => state.hasNextMessageInSeries
  );

  if (hasNextMessageInSeries) {
    return (
      <VStack
        style={{
          width: theme.layout.chat.messageSenderAvatar.width,
          height: theme.layout.chat.messageSenderAvatar.height,
        }}
      />
    );
  }

  return <MessageSenderAvatarDumb avatarName="TS" />;
});

const useStyles = () => {
  const { theme } = useAppTheme();
  const colorScheme = useColorScheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignSelf: "flex-start",
          alignItems: "flex-end",
          maxWidth: "85%",
          paddingHorizontal: theme.spacing.sm,
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
          borderBottomLeftRadius: theme.borderRadius.xs,
        },
        messageBubbleTailMe: {
          borderBottomRightRadius: theme.borderRadius.xs,
        },
        // messageText: {
        //   fontSize: 17,
        //   color: textPrimaryColor(colorScheme),
        // },
        // messageTextMe: {
        //   color: inversePrimaryColor(colorScheme),
        // },
        allEmojisAndMaxThree: {
          fontSize: 64,
          paddingHorizontal: 0,
        },
      }),
    [theme, colorScheme]
  );
};
