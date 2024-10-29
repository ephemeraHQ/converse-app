import { useCurrentAccount, useProfilesStore } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "@utils/profile";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";

import { MessageToDisplay } from "../Message";
import {
  DetailedReaction,
  MessageReactions,
  RolledUpReactions,
} from "./MessageReactions.types";
import { openMessageReactionsDrawer } from "./MessageReactionsDrawer/MessageReactionsDrawer.service";

type Props = {
  message: MessageToDisplay;
  reactions: MessageReactions;
};

const MAX_REACTION_EMOJIS_SHOWN = 3;

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

    if (rolledUpReactions.totalCount === 0) return null;

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
              {rolledUpReactions.preview.map((reaction, index) => (
                <Text key={index}>{reaction.content}</Text>
              ))}
            </HStack>
            {rolledUpReactions.totalCount > 1 && (
              <Text style={styles.reactorCount}>
                {rolledUpReactions.totalCount}
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

const useMessageReactionsRolledUp = (arg: {
  reactions: MessageReactions;
  userAddress: string;
}) => {
  const { reactions, userAddress } = arg;

  // Get social details for all unique addresses
  const addresses = Array.from(
    new Set(
      Object.values(reactions)
        .flat()
        .map((reaction) => reaction.senderAddress)
    )
  );

  const membersSocials = useProfilesStore((s) =>
    addresses.map((address) => {
      const socials = getProfile(address, s.profiles)?.socials;
      return {
        address,
        uri: getPreferredAvatar(socials),
        name: getPreferredName(socials, address),
      };
    })
  );

  return useMemo((): RolledUpReactions => {
    const detailed: DetailedReaction[] = [];
    let totalCount = 0;
    let userReacted = false;

    // Flatten reactions for more efficient iteration
    const flatReactions = Object.values(reactions).flat();
    totalCount = flatReactions.length;

    // Create a map to efficiently access social details by address
    const socialsMap = new Map(
      membersSocials.map((social) => [social.address, social])
    );

    // Map to keep track of each unique reaction content
    const reactionMap = new Map<string, DetailedReaction>();

    flatReactions.forEach((reaction) => {
      if (!reactionMap.has(reaction.content)) {
        reactionMap.set(reaction.content, {
          content: reaction.content,
          isOwnReaction: false,
          firstReactionTime: Infinity, // for min comparison
          reactors: [],
          count: 0,
        });
      }

      const detailEntry = reactionMap.get(reaction.content)!;
      const socialDetails = socialsMap.get(reaction.senderAddress);

      detailEntry.reactors.push({
        address: reaction.senderAddress,
        userName: socialDetails?.name, // TODO: fallback with short address
        avatar: socialDetails?.uri, // TODO: fallback avatar with initials
        reactionTime: reaction.sent,
      });

      detailEntry.count += 1;

      // Track if the user reacted and the earliest reaction time
      if (reaction.senderAddress.toLowerCase() === userAddress?.toLowerCase()) {
        detailEntry.isOwnReaction = true;
        userReacted = true;
      }
      detailEntry.firstReactionTime = Math.min(
        detailEntry.firstReactionTime,
        reaction.sent
      );
    });

    // Convert the map values to an array for the final detailed output
    detailed.push(...reactionMap.values());

    // Generate reactions preview by selecting top n reactions
    const preview = Array.from(reactionMap.values())
      .sort((a, b) => b.reactors.length - a.reactors.length)
      .slice(0, MAX_REACTION_EMOJIS_SHOWN)
      .map((reaction) => ({ content: reaction.content }));

    return {
      totalCount,
      userReacted,
      detailed,
      preview,
    };
  }, [reactions, userAddress, membersSocials]);
};

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
