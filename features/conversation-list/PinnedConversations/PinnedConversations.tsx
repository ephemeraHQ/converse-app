import { AnimatedCenter } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { PinnedV3DMConversation } from "@/features/conversation-list/PinnedConversations/PinnedV3DMConversation";
import { PinnedV3GroupConversation } from "@/features/conversation-list/PinnedConversations/PinnedV3GroupConversation";
import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/PinnedConversations/conversation-list-pinned-conversations.styles";
import { ConversationListAvatarSkeleton } from "@/features/conversation-list/components/conversation-list-avatar-skeleton";
import { useConversationListStoreForCurrentAccount } from "@/features/conversation-list/stores/conversation-list.store";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { hexToRGBA } from "@/utils/colors";
import { useCurrentAccount } from "@data/store/accountsStore";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { ViewStyle } from "react-native";
import { useConversationListConversation } from "../hooks/use-conversation-list-conversation";

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    const { themed, theme } = useAppTheme();

    const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
      (s) => s.pinnedConversationTopics
    );

    const currentAccount = useCurrentAccount();

    // We might have the topics in the store, but we need to make sure we actually
    // have the conversations otherwise we can't render anything
    const { isLoading, data: conversations } = useConversationListQuery({
      account: currentAccount!,
      context: "PinnedConversations",
      queryOptions: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    });

    // Return null if still loading
    if (isLoading) {
      return null;
    }

    if (!conversations) {
      return null;
    }

    // We have convos but no pinned ones
    if (
      conversations.length > 0 &&
      (!pinnedConversationTopics || pinnedConversationTopics.length === 0)
    ) {
      return null;
    }

    // Show skeleton if we have no conversations yet for better UX
    if (!conversations || conversations.length === 0) {
      return <PinnedConversationsSkeleton />;
    }

    return (
      <AnimatedHStack
        style={themed($container)}
        layout={theme.animation.reanimatedLayoutSpringTransition}
      >
        {pinnedConversationTopics?.map((topic) => (
          <AnimatedCenter
            key={topic}
            layout={theme.animation.reanimatedLayoutSpringTransition}
            entering={theme.animation.reanimatedFadeInScaleIn({
              delay: 100,
            })}
          >
            <PinnedConversationWrapper topic={topic} />
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
      <ConversationListAvatarSkeleton
        color={hexToRGBA("#FF8080", 0.15)}
        size={avatarSize}
      />
      <ConversationListAvatarSkeleton
        color={hexToRGBA("#FFE580", 0.3)}
        size={avatarSize}
      />
      <ConversationListAvatarSkeleton
        color={hexToRGBA("#80D9FF", 0.15)}
        size={avatarSize}
      />
    </AnimatedHStack>
  );
});

const PinnedConversationWrapper = memo(
  function PinnedConversationWrapper(props: { topic: ConversationTopic }) {
    const { topic } = props;

    const conversation = useConversationListConversation(topic);

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
