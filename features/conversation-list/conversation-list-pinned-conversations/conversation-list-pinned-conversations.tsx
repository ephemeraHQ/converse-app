import { AnimatedCenter } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { AnimatedVStack } from "@/design-system/VStack";
import { ConversationListItemAvatarSkeleton } from "@/features/conversation-list/conversation-list-item/conversation-list-item-avatar-skeleton";
import { ConversationListPinnedConversationDm } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-dm";
import { ConversationListPinnedConversationGroup } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-group";
import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles";
import { useConversationsCount } from "@/features/conversation-list/hooks/use-conversations-count";
import { usePinnedConversations } from "@/features/conversation-list/hooks/use-pinned-conversations";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { hexToRGBA } from "@/utils/colors";
import { chunk } from "@/utils/general";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { ViewStyle } from "react-native";
import { useConversationByTopic } from "../hooks/use-conversation-by-topic";

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    const { themed, theme } = useAppTheme();

    const { pinnedConversations, isLoading: isLoadingPinnedConversations } =
      usePinnedConversations();

    const {
      count: conversationsCount,
      isLoading: conversationsCountIsLoading,
    } = useConversationsCount();

    if (isLoadingPinnedConversations || conversationsCountIsLoading) {
      return null;
    }

    if (conversationsCount === 0) {
      return <PinnedConversationsSkeleton />;
    }

    const hasPinnedConversations =
      pinnedConversations && pinnedConversations?.length > 0;

    if (!hasPinnedConversations) {
      return null;
    }
    return (
      <AnimatedVStack
        style={themed($container)}
        layout={theme.animation.reanimatedLayoutSpringTransition}
        exiting={theme.animation.reanimatedFadeOutSpring}
      >
        {chunk(pinnedConversations, 3).map((row, rowIndex) => (
          <AnimatedHStack
            key={`row-${rowIndex}`}
            style={[
              themed($pinnedRow),
              {
                justifyContent: row.length > 2 ? "space-between" : "center",
              },
            ]}
            layout={theme.animation.reanimatedLayoutSpringTransition}
          >
            {row.map((conversation) => (
              <AnimatedCenter
                key={conversation.topic}
                layout={theme.animation.reanimatedLayoutSpringTransition}
                entering={theme.animation.reanimatedFadeInScaleIn({
                  delay: 100,
                })}
              >
                <PinnedConversationWrapper topic={conversation.topic} />
              </AnimatedCenter>
            ))}
          </AnimatedHStack>
        ))}
      </AnimatedVStack>
    );
  }
);

const PinnedConversationsSkeleton = memo(function () {
  const { themed } = useAppTheme();

  const { avatarSize } = useConversationListPinnedConversationsStyles();

  return (
    <AnimatedHStack style={themed($container)}>
      <ConversationListItemAvatarSkeleton
        color={hexToRGBA("#FF8080", 0.15)}
        size={avatarSize}
      />
      <ConversationListItemAvatarSkeleton
        color={hexToRGBA("#FFE580", 0.3)}
        size={avatarSize}
      />
      <ConversationListItemAvatarSkeleton
        color={hexToRGBA("#80D9FF", 0.15)}
        size={avatarSize}
      />
    </AnimatedHStack>
  );
});

const PinnedConversationWrapper = memo(
  function PinnedConversationWrapper(props: { topic: ConversationTopic }) {
    const { topic } = props;

    const conversation = useConversationByTopic(topic);

    if (!conversation) {
      captureError(
        new Error(
          `Couldn't find conversation ${topic} in PinnedConversationWrapper`
        )
      );
      return null;
    }

    if (isConversationGroup(conversation)) {
      return <ConversationListPinnedConversationGroup group={conversation} />;
    }

    return <ConversationListPinnedConversationDm conversation={conversation} />;
  }
);
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  rowGap: spacing.lg,
});

const $pinnedRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "space-between",
  columnGap: spacing.lg, // We want minimum gap between pinned conversations
  flexWrap: "wrap",
  rowGap: spacing.lg,
});
