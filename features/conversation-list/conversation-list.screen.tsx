import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedVStack } from "@/design-system/VStack";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { ConversationListItemDm } from "@/features/conversation-list/conversation-list-item/conversation-list-item-dm";
import { ConversationListItemGroup } from "@/features/conversation-list/conversation-list-item/conversation-list-item-group";
import { ConversationListLoading } from "@/features/conversation-list/conversation-list-loading";
import { ConversationListPinnedConversations } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations";
import {
  useDmConversationContextMenuViewProps,
  useGroupConversationContextMenuViewProps,
} from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-props";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useMinimumLoadingTime } from "@/hooks/use-minimum-loading-time";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo, useCallback } from "react";
import { ContextMenuView } from "react-native-ios-context-menu";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConversationListAwaitingRequests } from "./conversation-list-awaiting-requests";
import { ConversationListEmpty } from "./conversation-list-empty";
import { ConversationListStartNewConvoBanner } from "./conversation-list-start-new-convo-banner";
import { useHeaderWrapper } from "./conversation-list.screen-header";
import { useConversationListConversations } from "./use-conversation-list-conversations";
import { usePinnedConversations } from "@/features/conversation-list/hooks/use-pinned-conversations";

type IConversationListProps = NativeStackScreenProps<
  NavigationParamList,
  "Chats"
>;

export function ConversationListScreen(props: IConversationListProps) {
  const {
    data: conversations,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
  } = useConversationListConversations();

  const { theme } = useAppTheme();

  const insets = useSafeAreaInsets();

  useHeaderWrapper();

  const handleRefresh = useCallback(async () => {
    try {
      await refetchConversations();
    } catch (error) {
      captureError(error);
    }
  }, [refetchConversations]);

  // Better UX to at least show loading for 3 seconds
  const isLoading = useMinimumLoadingTime({
    isLoading: isLoadingConversations,
    minimumTime: 2500,
  });

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      {isLoading ? (
        <ConversationListLoading />
      ) : (
        <ConversationList
          conversations={conversations ?? []}
          scrollEnabled={conversations && conversations?.length > 0}
          ListEmptyComponent={<ConversationListEmpty />}
          ListHeaderComponent={<ListHeader />}
          onRefetch={handleRefresh}
          onLayout={() => {}}
          layout={theme.animation.reanimatedLayoutSpringTransition}
          removeClippedSubviews={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom,
            flex: 1,
          }}
          renderConversation={({ item }) => {
            return isConversationGroup(item) ? (
              <ConversationListItemGroupWrapper group={item} />
            ) : (
              <ConversationListItemDmWrapper dm={item} />
            );
          }}
        />
      )}
    </Screen>
  );
}

const ConversationListItemDmWrapper = memo(
  function ConversationListItemDmWrapper(props: { dm: DmWithCodecsType }) {
    const { dm } = props;

    const { theme } = useAppTheme();

    const contextMenuProps = useDmConversationContextMenuViewProps({
      dmConversationTopic: dm.topic,
    });

    return (
      <ContextMenuView hitSlop={theme.spacing.xs} {...contextMenuProps}>
        <ConversationListItemDm conversationTopic={dm.topic} />
      </ContextMenuView>
    );
  }
);

const ConversationListItemGroupWrapper = memo(
  function ConversationListItemGroupWrapper(props: {
    group: GroupWithCodecsType;
  }) {
    const { group } = props;

    const { theme } = useAppTheme();

    const contextMenuProps = useGroupConversationContextMenuViewProps({
      groupConversationTopic: group.topic,
    });

    return (
      <ContextMenuView hitSlop={theme.spacing.xs} {...contextMenuProps}>
        <ConversationListItemGroup conversationTopic={group.topic} />
      </ContextMenuView>
    );
  }
);

const ListHeader = React.memo(function ListHeader() {
  const { theme } = useAppTheme();

  const { data: conversations } = useConversationListConversations();
  const { pinnedConversations } = usePinnedConversations();
  const hasNoConversations =
    conversations &&
    conversations.length === 0 &&
    pinnedConversations &&
    pinnedConversations.length === 0;

  return (
    <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
      {/* {ephemeralAccount && <EphemeralAccountBanner />} */}
      {hasNoConversations && <ConversationListStartNewConvoBanner />}
      <ConversationListPinnedConversations />
      <ConversationListAwaitingRequests />
    </AnimatedVStack>
  );
});
