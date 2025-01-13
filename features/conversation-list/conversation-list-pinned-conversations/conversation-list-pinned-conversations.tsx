import { AnimatedCenter } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { ConversationListItemAvatarSkeleton } from "@/features/conversation-list/conversation-list-item/conversation-list-item-avatar-skeleton";
import { PinnedV3DMConversation } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-dm";
import { PinnedV3GroupConversation } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-group";
import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles";
import { useConversationsCount } from "@/features/conversation-list/hooks/use-conversations-count";
import { usePinnedConversations } from "@/features/conversation-list/hooks/use-pinned-conversations";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { hexToRGBA } from "@/utils/colors";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { ViewStyle } from "react-native";
import { useConversationByTopic } from "../hooks/use-conversation-by-topic";

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    const { themed, theme } = useAppTheme();

    const { pinnedConversations, isLoading } = usePinnedConversations();

    const conversationsCount = useConversationsCount();

    if (isLoading) {
      return null;
    }

    // Show skeleton if we have no conversations yet for better UX
    if (conversationsCount === 0) {
      return <PinnedConversationsSkeleton />;
    }

    // Don't show anything because user has "onboarded" and don't need placeholders anymore
    if (conversationsCount > 0 && pinnedConversations?.length === 0) {
      return null;
    }

    return (
      <AnimatedHStack
        style={themed($container)}
        layout={theme.animation.reanimatedLayoutSpringTransition}
      >
        {pinnedConversations?.map((conversation) => (
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
      return <PinnedV3GroupConversation group={conversation} />;
    }

    return <PinnedV3DMConversation conversation={conversation} />;
  }
);

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  columnGap: spacing.sm,
  flexWrap: "wrap",
  rowGap: spacing.lg,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
});
