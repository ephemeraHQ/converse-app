import { useCurrentAccount } from "@data/store/accountsStore";
import { useAppTheme } from "@theme/useAppTheme";
import {
  MessageReaction,
  addReactionToMessage,
  removeReactionFromMessage,
} from "@utils/reactions";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
};

type ReactionCount = {
  content: string;
  count: number;
  userReacted: boolean;
  reactors: string[];
  firstReactionTime: number;
};

function ChatMessageReactions({ message, reactions }: Props) {
  const styles = useStyles();
  const userAddress = useCurrentAccount();

  const reactionsList = useMemo(() => {
    return Object.entries(reactions)
      .flatMap(([senderAddress, reactions]) =>
        reactions.map((reaction) => ({ ...reaction, senderAddress }))
      )
      .sort((r1, r2) => r1.sent - r2.sent);
  }, [reactions]);

  const reactionCounts = useMemo(() => {
    const counts: { [content: string]: ReactionCount } = {};

    Object.values(reactions).forEach((reactionArray) => {
      reactionArray.forEach((reaction) => {
        if (!counts[reaction.content]) {
          counts[reaction.content] = {
            content: reaction.content,
            count: 0,
            userReacted: false,
            reactors: [],
            firstReactionTime: reaction.sent,
          };
        }
        counts[reaction.content].count++;
        counts[reaction.content].reactors.push(reaction.senderAddress);
        if (
          reaction.senderAddress.toLowerCase() === userAddress?.toLowerCase()
        ) {
          counts[reaction.content].userReacted = true;
        }
        // Keep track of the earliest reaction time for this emoji
        counts[reaction.content].firstReactionTime = Math.min(
          counts[reaction.content].firstReactionTime,
          reaction.sent
        );
      });
    });

    // Convert to array and sort
    return Object.values(counts).sort((a, b) => {
      // Sort by the time of the first reaction (ascending)
      return a.firstReactionTime - b.firstReactionTime;
    });
  }, [reactions, userAddress]);

  const handleReactionPress = useCallback(
    (reaction: ReactionCount) => {
      if (!userAddress) return;

      if (reaction.userReacted) {
        removeReactionFromMessage(userAddress, message, reaction.content);
      } else {
        addReactionToMessage(userAddress, message, reaction.content);
      }
    },
    [message, userAddress]
  );

  if (reactionsList.length === 0) return null;

  return (
    <View
      style={[
        styles.reactionsWrapper,
        message.fromMe && { justifyContent: "flex-end" },
      ]}
    >
      {reactionCounts.map((reaction) => {
        const reactorCount = reaction.reactors.length;
        return (
          <TouchableOpacity
            key={reaction.content}
            onPress={() => handleReactionPress(reaction)}
            style={[
              styles.reactionButton,
              reaction.userReacted
                ? message.fromMe
                  ? styles.myReactionToMyMessageButton
                  : styles.myReactionToOtherMessageButton
                : styles.otherReactionButton,
            ]}
          >
            <Text style={styles.emoji}>{reaction.content}</Text>
            <View style={styles.reactorContainer}>
              <Text style={styles.reactorCount}>{reactorCount}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default memo(ChatMessageReactions, (prevProps, nextProps) => {
  if (prevProps.message.id !== nextProps.message.id) {
    return false;
  }
  if (prevProps.message.lastUpdateAt !== nextProps.message.lastUpdateAt) {
    return false;
  }
  return true;
});

const useStyles = () => {
  const { theme } = useAppTheme();

  return StyleSheet.create({
    reactionsWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: theme.spacing["4xs"],
      columnGap: theme.spacing["4xs"],
    },
    reactionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    },
    // TODO: merge
    myReactionToOtherMessageButton: {
      backgroundColor: theme.colors.fill.minimal,
    },
    myReactionToMyMessageButton: {
      backgroundColor: theme.colors.fill.minimal,
    },
    // TODO: remove
    otherReactionButton: {},
    emoji: {
      fontSize: 14,
    },
    reactorContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    reactorCount: {
      fontSize: 12,
      marginLeft: theme.spacing.xxxs,
      color: theme.colors.text.secondary,
    },
  });
};
