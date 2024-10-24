import { useCurrentAccount } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";

import { MessageToDisplay } from "../Message";
import { MessageReactions } from "./MessageReactions.types";
import { openMessageReactionsDrawer } from "./MessageReactionsDrawer/MessageReactionsDrawer.utils";
import { useMessageReactionsRolledup } from "./useMessageReactionsRolledup";

type Props = {
  message: MessageToDisplay;
  reactions: MessageReactions;
};

export const ChatMessageReactions = memo(
  ({ message, reactions }: Props) => {
    const styles = useStyles();
    const { theme } = useAppTheme();
    const userAddress = useCurrentAccount();

    const rolledUpReactions = useMessageReactionsRolledup({
      reactions,
      userAddress: userAddress!, // ! If we are here, the user is logged in
    });

    const handlePress = useCallback(() => {
      openMessageReactionsDrawer(message);
    }, [message]);

    if (rolledUpReactions.totalReactions === 0) return null;

    return (
      <HStack
        style={[
          styles.reactionsWrapper,
          message.fromMe && { justifyContent: "flex-end" },
        ]}
      >
        <TouchableHighlight onPress={handlePress} underlayColor="transparent">
          <VStack
            style={[
              styles.reactionButton,
              rolledUpReactions.userReacted && {
                borderColor: theme.colors.fill.minimal,
                backgroundColor: theme.colors.fill.minimal,
              },
            ]}
          >
            <HStack style={styles.emojiContainer}>
              {rolledUpReactions.emojis.map((emoji, index) => (
                <Text key={index}>{emoji}</Text>
              ))}
            </HStack>
            {rolledUpReactions.totalReactions > 1 && (
              <Text style={styles.reactorCount}>
                {rolledUpReactions.totalReactions}
              </Text>
            )}
          </VStack>
        </TouchableHighlight>
      </HStack>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.message.id !== nextProps.message.id) {
      return false;
    }
    if (prevProps.message.lastUpdateAt !== nextProps.message.lastUpdateAt) {
      return false;
    }
    return true;
  }
);

const useStyles = () => {
  const { theme } = useAppTheme();

  return StyleSheet.create({
    reactionsWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    reactionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.borderRadius.sm,
      borderWidth: theme.borderWidth.sm,
      borderColor: theme.colors.border.subtle,
    },
    emojiContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xxxs,
    },
    reactorCount: {
      marginLeft: theme.spacing.xxxs,
      color: theme.colors.text.secondary,
    },
  });
};
