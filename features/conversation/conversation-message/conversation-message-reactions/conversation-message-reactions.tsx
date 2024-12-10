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
import { useConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message.utils";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message.store-context";
import { useSelect } from "@/data/store/storeHelpers";
import {
  RolledUpReactions,
  SortedReaction,
} from "./conversation-message-reactions.types";
import { openMessageReactionsDrawer } from "./conversation-message-reaction-drawer/conversation-message-reaction-drawer.service.";

const MAX_REACTION_EMOJIS_SHOWN = 3;

export const ConversationMessageReactions = memo(
  function ConversationMessageReactions() {
    const { themed, theme } = useAppTheme();

    const { fromMe } = useMessageContextStoreContext(useSelect(["fromMe"]));

    const rolledUpReactions = useMessageReactionsRolledUp();

    const handlePressContainer = useCallback(() => {
      openMessageReactionsDrawer(rolledUpReactions);
    }, [rolledUpReactions]);

    if (rolledUpReactions.totalCount === 0) {
      return null;
    }

    return (
      <HStack
        style={[
          {
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: theme.spacing.xxxs,
          },
          fromMe && { justifyContent: "flex-end" },
        ]}
      >
        <TouchableHighlight
          onPress={handlePressContainer}
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
  }
);

function useMessageReactionsRolledUp() {
  const { messageId } = useMessageContextStoreContext(useSelect(["messageId"]));

  const { bySender: reactions } = useConversationMessageReactions(messageId);

  const userAddress = useCurrentAccount();

  // Get social details for all unique addresses
  const addresses = Array.from(
    new Set(
      Object.entries(reactions ?? {}).map(([senderAddress]) => senderAddress)
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

    // Flatten reactions and track sender addresses
    const flatReactions = Object.entries(reactions ?? {}).flatMap(
      ([senderAddress, senderReactions]) =>
        senderReactions.map((reaction) => ({ senderAddress, ...reaction }))
    );
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
}

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
