import { useCurrentAccount } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";

import { MessageToDisplay } from "../Message";
import {
  MessageReactions,
  ReactionDetails,
  RolledUpReactions,
} from "./MessageReactions.types";
import { openMessageReactionsDrawer } from "./MessageReactionsDrawer/MessageReactionsDrawer.service";

type Props = {
  message: MessageToDisplay;
  reactions: MessageReactions;
};

export const ChatMessageReactions = memo(
  ({ message, reactions }: Props) => {
    const styles = useStyles();
    const { theme } = useAppTheme();
    const userAddress = useCurrentAccount();

    const rolledUpReactions = useMessageReactionsRolledUp({
      reactions,
      userAddress: userAddress!, // ! If we are here, the user is logged in
    });

    const handlePress = useCallback(() => {
      openMessageReactionsDrawer(rolledUpReactions);
    }, [rolledUpReactions]);

    if (rolledUpReactions.totalReactions === 0) return null;

    return (
      <HStack
        style={[
          styles.reactionsWrapper,
          message.fromMe && { justifyContent: "flex-end" },
        ]}
      >
        <TouchableHighlight
          onPress={handlePress}
          underlayColor="transparent"
          accessibilityRole="button"
          accessibilityLabel="View reactions"
        >
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
    // Compare reactions to ensure updates are not missed
    if (prevProps.reactions !== nextProps.reactions) {
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

const MAX_REACTION_EMOJIS_SHOWN = 3;

function useMessageReactionsRolledUp(arg: {
  reactions: MessageReactions;
  userAddress: string;
}) {
  const { reactions, userAddress } = arg;

  return useMemo((): RolledUpReactions => {
    const details: { [content: string]: ReactionDetails } = {};
    let totalReactions = 0;
    let userReacted = false;

    Object.values(reactions).forEach((reactionArray) => {
      reactionArray.forEach((reaction) => {
        if (!details[reaction.content]) {
          details[reaction.content] = {
            content: reaction.content,
            count: 0,
            userReacted: false,
            reactors: [],
            firstReactionTime: reaction.sent,
          };
        }
        details[reaction.content].count++;
        details[reaction.content].reactors.push(reaction.senderAddress);
        if (
          reaction.senderAddress.toLowerCase() === userAddress?.toLowerCase()
        ) {
          details[reaction.content].userReacted = true;
          userReacted = true;
        }
        // Keep track of the earliest reaction time for this emoji
        details[reaction.content].firstReactionTime = Math.min(
          details[reaction.content].firstReactionTime,
          reaction.sent
        );
        totalReactions++;
      });
    });

    // Sort by the number of reactors in descending order
    const sortedReactions = Object.values(details)
      .sort((a, b) => b.reactors.length - a.reactors.length)
      .slice(0, MAX_REACTION_EMOJIS_SHOWN)
      .map((reaction) => reaction.content);

    return { emojis: sortedReactions, totalReactions, userReacted, details };
  }, [reactions, userAddress]);
}
