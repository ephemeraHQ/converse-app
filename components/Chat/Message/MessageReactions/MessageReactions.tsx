import { useCurrentAccount, useProfilesStore } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "@utils/profile";
import { memo, useCallback, useMemo } from "react";
import { TouchableHighlight, ViewStyle } from "react-native";

import { MessageToDisplay } from "../Message";
import {
  MessageReactions,
  RolledUpReactions,
  SortedReaction,
} from "./MessageReactions.types";
import { openMessageReactionsDrawer } from "./MessageReactionsDrawer/MessageReactionsDrawer.service";

type Props = {
  message: MessageToDisplay;
  reactions: MessageReactions;
};

const MAX_REACTION_EMOJIS_SHOWN = 3;

export const ChatMessageReactions = memo(
  ({ message, reactions }: Props) => {
    const { themed } = useAppTheme();
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
          {
            flexDirection: "row",
            flexWrap: "wrap",
          },
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
              themed($reactionButton),
              rolledUpReactions.userReacted && themed($reactionButtonActive),
            ]}
          >
            <HStack style={themed($emojiContainer)}>
              {rolledUpReactions.preview
                .slice(0, MAX_REACTION_EMOJIS_SHOWN)
                .map((reaction, index) => (
                  <Text key={index}>{reaction.content}</Text>
                ))}
            </HStack>
            {rolledUpReactions.totalCount > 1 && (
              <Text style={themed($reactorCount)}>
                {rolledUpReactions.totalCount}
              </Text>
            )}
          </VStack>
        </TouchableHighlight>
      </HStack>
    );
  },
  (prevProps, nextProps) =>
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.lastUpdateAt === nextProps.message.lastUpdateAt &&
    prevProps.reactions === nextProps.reactions
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
    const detailed: SortedReaction[] = [];
    let totalCount = 0;
    let userReacted = false;

    // Flatten reactions for more efficient iteration
    const flatReactions = Object.values(reactions).flat();
    totalCount = flatReactions.length;

    // Create a map to efficiently access social details by address
    const socialsMap = new Map(
      membersSocials.map((social) => [social.address, social])
    );

    // Track reaction counts for preview
    const previewCounts = new Map<string, number>();

    flatReactions.forEach((reaction) => {
      const isOwnReaction =
        reaction.senderAddress.toLowerCase() === userAddress?.toLowerCase();
      if (isOwnReaction) userReacted = true;

      // Count reactions for the preview
      previewCounts.set(
        reaction.content,
        (previewCounts.get(reaction.content) || 0) + 1
      );

      // Add to detailed array
      const socialDetails = socialsMap.get(reaction.senderAddress);
      detailed.push({
        content: reaction.content,
        isOwnReaction,
        reactor: {
          address: reaction.senderAddress,
          userName: socialDetails?.name,
          avatar: socialDetails?.uri,
          reactionTime: reaction.sent,
        },
      });
    });

    // Sort detailed array to place all OWN reactions at the beginning
    detailed.sort((a, b) => Number(b.isOwnReaction) - Number(a.isOwnReaction));

    // Convert previewCounts map to array with content and count
    const preview = Array.from(previewCounts, ([content, count]) => ({
      content,
      count,
    }));

    return {
      totalCount,
      userReacted,
      preview,
      detailed,
    };
  }, [reactions, userAddress, membersSocials]);
};

const $reactionButton: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
  borderRadius,
  borderWidth,
}) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
});

const $reactionButtonActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.fill.minimal,
  backgroundColor: colors.fill.minimal,
});

const $emojiContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xxxs,
});

const $reactorCount: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginLeft: spacing.xxxs,
  color: colors.text.secondary,
});
