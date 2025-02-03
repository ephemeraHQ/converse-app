import { useCurrentAccount } from "@/data/store/accountsStore";
import { AnimatedCenter } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { AnimatedVStack } from "@/design-system/VStack";
import { ConversationListItemAvatarSkeleton } from "@/features/conversation-list/conversation-list-item/conversation-list-item-avatar-skeleton";
import { ConversationListPinnedConversationDm } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-dm";
import { ConversationListPinnedConversationGroup } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-group";
import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles";
import { useAllowedConversationsCount } from "@/features/conversation-list/hooks/use-conversations-count";
import { usePinnedConversations } from "@/features/conversation-list/hooks/use-pinned-conversations";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useConversationQuery } from "@/queries/conversation-query";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { hexToRGBA } from "@/utils/colors";
import { chunk } from "@/utils/general";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { ViewStyle } from "react-native";

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    const { themed, theme } = useAppTheme();

    const { pinnedConversations, isLoading: isLoadingPinnedConversations } =
      usePinnedConversations();

    const {
      count: allowedConversationsCount,
      isLoading: allowedConversationsCountIsLoading,
    } = useAllowedConversationsCount();

    if (isLoadingPinnedConversations || allowedConversationsCountIsLoading) {
      return null;
    }

    if (allowedConversationsCount === 0) {
      return null;
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
                entering={theme.animation.reanimatedFadeInSpring}
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

    const currentAccount = useCurrentAccount();

    const { data: conversation } = useConversationQuery({
      topic,
      account: currentAccount!,
      caller: "Conversation List Pinned Conversations",
    });

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
  justifyContent: "space-between",
});

const $pinnedRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "space-between",
  columnGap: spacing.lg, // We want minimum gap between pinned conversations
  flexWrap: "wrap",
  rowGap: spacing.lg,
});
