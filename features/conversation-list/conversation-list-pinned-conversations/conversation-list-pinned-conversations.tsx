import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { useWindowDimensions, ViewStyle } from "react-native";
import { AnimatedCenter } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { AnimatedVStack } from "@/design-system/VStack";
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store";
import { ConversationListPinnedConversationDm } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-dm";
import { ConversationListPinnedConversationGroup } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-group";
import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles";
import { useConversationListStyles } from "@/features/conversation-list/conversation-list.styles";
import { useAllowedConversationsCount } from "@/features/conversation-list/hooks/use-conversations-count";
import { usePinnedConversations } from "@/features/conversation-list/hooks/use-pinned-conversations";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useConversationQuery } from "@/queries/conversation-query";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { captureError } from "@/utils/capture-error";
import { chunk } from "@/utils/general";

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    const { themed, theme } = useAppTheme();

    const { pinnedConversations, isLoading: isLoadingPinnedConversations } =
      usePinnedConversations();

    const { avatarSize } = useConversationListPinnedConversationsStyles();

    const {
      count: allowedConversationsCount,
      isLoading: allowedConversationsCountIsLoading,
    } = useAllowedConversationsCount();

    const { screenHorizontalPadding } = useConversationListStyles();

    const { width } = useWindowDimensions();

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
                columnGap:
                  (width - screenHorizontalPadding * 2 - avatarSize * 3) / 2,
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
  },
);

const PinnedConversationWrapper = memo(
  function PinnedConversationWrapper(props: { topic: ConversationTopic }) {
    const { topic } = props;

    const currentAccount = useCurrentSenderEthAddress();

    const { data: conversation } = useConversationQuery({
      topic,
      account: currentAccount!,
      caller: "Conversation List Pinned Conversations",
    });

    if (!conversation) {
      captureError(
        new Error(
          `Couldn't find conversation ${topic} in PinnedConversationWrapper`,
        ),
      );
      return null;
    }

    if (isConversationGroup(conversation)) {
      return <ConversationListPinnedConversationGroup group={conversation} />;
    }

    return <ConversationListPinnedConversationDm conversation={conversation} />;
  },
);
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  rowGap: spacing.lg,
  justifyContent: "space-between",
});

const $pinnedRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  flexWrap: "wrap",
  rowGap: spacing.lg,
});
