import { useCurrentAccount } from "@data/store/accountsStore";
import { useAppTheme } from "@theme/useAppTheme";
import { MessageReaction } from "@utils/reactions";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MessageToDisplay } from "./Message";

const MAX_REACTION_EMOJIS_SHOWN = 3;

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

type RolledUpReactions = {
  emojis: string[];
  totalReactions: number;
  userReacted: boolean;
};

export const ChatMessageReactions = memo(
  ({ message, reactions }: Props) => {
    const styles = useStyles();
    const { theme } = useAppTheme();
    const userAddress = useCurrentAccount();

    const reactionsList = useMemo(() => {
      return Object.entries(reactions)
        .flatMap(([senderAddress, reactions]) =>
          reactions.map((reaction) => ({ ...reaction, senderAddress }))
        )
        .sort((r1, r2) => r1.sent - r2.sent);
    }, [reactions]);

    const rolledUpReactions: RolledUpReactions = useMemo(() => {
      const counts: { [content: string]: ReactionCount } = {};
      let totalReactions = 0;
      let userReacted = false;

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
            userReacted = true;
          }
          // Keep track of the earliest reaction time for this emoji
          counts[reaction.content].firstReactionTime = Math.min(
            counts[reaction.content].firstReactionTime,
            reaction.sent
          );
          totalReactions++;
        });
      });

      // Sort by the number of reactors in descending order
      const sortedReactions = Object.values(counts)
        .sort((a, b) => b.reactors.length - a.reactors.length)
        .slice(0, MAX_REACTION_EMOJIS_SHOWN)
        .map((reaction) => reaction.content);

      return { emojis: sortedReactions, totalReactions, userReacted };
    }, [reactions, userAddress]);

    if (reactionsList.length === 0) return null;

    return (
      <View
        style={[
          styles.reactionsWrapper,
          message.fromMe && { justifyContent: "flex-end" },
        ]}
      >
        <View
          style={[
            styles.reactionButton,
            rolledUpReactions.userReacted && {
              borderColor: theme.colors.fill.minimal,
              backgroundColor: theme.colors.fill.minimal,
            },
          ]}
        >
          <View style={styles.emojiContainer}>
            {rolledUpReactions.emojis.map((emoji, index) => (
              <Text key={index}>{emoji}</Text>
            ))}
          </View>
          {rolledUpReactions.totalReactions > 1 && (
            <Text style={styles.reactorCount}>
              {rolledUpReactions.totalReactions}
            </Text>
          )}
        </View>
      </View>
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
