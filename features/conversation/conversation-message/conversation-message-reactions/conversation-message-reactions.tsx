import { useSelect } from "@/data/store/storeHelpers";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useConversationMessageReactions } from "@/features/conversation/conversation-message/conversation-message.utils";
import {
  isCurrentUserInboxId,
  useCurrentAccountInboxId,
} from "@/hooks/use-current-account-inbox-id";
import { useInboxProfileSocialsQueries } from "@/queries/useInboxProfileSocialsQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { AnimatedHStack, HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import {
  getPreferredInboxAddress,
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@utils/profile";
import { memo, useCallback, useMemo } from "react";
import { TouchableHighlight, ViewStyle } from "react-native";
import { openMessageReactionsDrawer } from "./conversation-message-reaction-drawer/conversation-message-reaction-drawer.service";
import {
  RolledUpReactions,
  SortedReaction,
} from "./conversation-message-reactions.types";

const MAX_REACTION_EMOJIS_SHOWN = 3;

export const ConversationMessageReactions = memo(
  function ConversationMessageReactions() {
    const { themed, theme } = useAppTheme();

    const { fromMe } = useMessageContextStoreContext(useSelect(["fromMe"]));

    const rolledUpReactions = useMessageReactionsRolledUp();

    const { hasNextMessageInSeries } = useMessageContextStoreContext(
      useSelect(["hasNextMessageInSeries"])
    );

    const handlePressContainer = useCallback(() => {
      openMessageReactionsDrawer(rolledUpReactions);
    }, [rolledUpReactions]);

    if (rolledUpReactions.totalCount === 0) {
      return null;
    }

    return (
      <AnimatedHStack
        entering={theme.animation.reanimatedFadeInScaleIn()}
        style={[
          {
            flexDirection: "row",
            flexWrap: "wrap",
            ...(hasNextMessageInSeries && {
              marginBottom: theme.spacing.xxxs,
            }),
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
      </AnimatedHStack>
    );
  }
);

function useMessageReactionsRolledUp() {
  const { messageId } = useMessageContextStoreContext(useSelect(["messageId"]));
  const { bySender: reactionsBySender } =
    useConversationMessageReactions(messageId);
  const currentAddress = useCurrentAccount()!;
  const { data: currentUserInboxId } = useCurrentAccountInboxId();

  const inboxIds = Array.from(
    new Set(
      Object.entries(reactionsBySender ?? {}).map(
        ([senderInboxId]) => senderInboxId
      )
    )
  );

  const inboxProfileSocialsQueries = useInboxProfileSocialsQueries(
    currentAddress,
    inboxIds
  );

  const membersSocials = inboxProfileSocialsQueries.map(
    ({ data: socials }, index) => {
      return {
        inboxId: inboxIds[index],
        address: getPreferredInboxAddress(socials),
        uri: getPreferredInboxAvatar(socials),
        name: getPreferredInboxName(socials),
      };
    }
  );

  return useMemo((): RolledUpReactions => {
    const detailed: SortedReaction[] = [];
    let totalCount = 0;
    let userReacted = false;

    // Flatten reactions and track sender addresses
    const flatReactions = Object.entries(reactionsBySender ?? {}).flatMap(
      ([senderInboxId, senderReactions]) =>
        senderReactions.map((reaction) => ({ senderInboxId, ...reaction }))
    );
    totalCount = flatReactions.length;

    // Track reaction counts for preview
    const previewCounts = new Map<string, number>();

    flatReactions.forEach((reaction) => {
      const isOwnReaction = isCurrentUserInboxId(reaction.senderInboxId);

      if (isOwnReaction) {
        userReacted = true;
      }

      // Count reactions for the preview
      previewCounts.set(
        reaction.content,
        (previewCounts.get(reaction.content) || 0) + 1
      );

      const socialDetails = membersSocials.find(
        (social) => social.inboxId === reaction.senderInboxId
      );

      detailed.push({
        content: reaction.content,
        isOwnReaction,
        reactor: {
          address: reaction.senderInboxId,
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
  }, [reactionsBySender, membersSocials]);
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
