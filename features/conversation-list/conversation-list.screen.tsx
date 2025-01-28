import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { useSettingsStore } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { Text } from "@/design-system/Text";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { ConversationListItemDm } from "@/features/conversation-list/conversation-list-item/conversation-list-item-dm";
import { ConversationListItemGroup } from "@/features/conversation-list/conversation-list-item/conversation-list-item-group";
import { ConversationListPinnedConversations } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations";
import { useConversationListStyles } from "@/features/conversation-list/conversation-list.styles";
import {
  useDmConversationContextMenuViewProps,
  useGroupConversationContextMenuViewProps,
} from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-props";
import { useShouldShowConnecting } from "@/features/conversation-list/hooks/useShouldShowConnecting";
import { useShouldShowConnectingOrSyncing } from "@/features/conversation-list/hooks/useShouldShowConnectingOrSyncing";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { translate } from "@/i18n";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { useDisconnectActionSheet } from "@hooks/useDisconnectActionSheet";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo, useCallback } from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import { ContextMenuView } from "react-native-ios-context-menu";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConversationListAwaitingRequests } from "./conversation-list-awaiting-requests";
import { ConversationListEmpty } from "./conversation-list-empty";
import { useHeaderWrapper } from "./conversation-list.screen-header";
import { useConversationListConversations } from "./use-conversation-list-conversations";

type IConversationListProps = NativeStackScreenProps<
  NavigationParamList,
  "Chats"
>;

export function ConversationListScreen(props: IConversationListProps) {
  const { data: conversations, refetch: refetchConversations } =
    useConversationListConversations();

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

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
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
        }}
        renderConversation={({ item }) => {
          return isConversationGroup(item) ? (
            <ConversationListItemGroupWrapper group={item} />
          ) : (
            <ConversationListItemDmWrapper dm={item} />
          );
        }}
      />
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
      <ContextMenuView
        style={{
          flex: 1,
        }}
        hitSlop={theme.spacing.xs}
        {...contextMenuProps}
      >
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
      <ContextMenuView
        style={{
          flex: 1,
        }}
        hitSlop={theme.spacing.xs}
        {...contextMenuProps}
      >
        <ConversationListItemGroup conversationTopic={group.topic} />
      </ContextMenuView>
    );
  }
);

const ListHeader = React.memo(function ListHeader() {
  const { theme } = useAppTheme();
  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

  return (
    <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
      <States />
      {ephemeralAccount && <EphemeralAccountBanner />}
      <ConversationListPinnedConversations />
      <ConversationListAwaitingRequests />
    </AnimatedVStack>
  );
});

const States = memo(function States() {
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const shouldShowConnecting = useShouldShowConnecting();

  // TODO: Not sure about those
  if (shouldShowConnectingOrSyncing) {
    return null;
  }

  // TODO: Not sure about those
  if (shouldShowConnecting) {
    return null;
  }

  return null;
});

const EphemeralAccountBanner = React.memo(function EphemeralAccountBanner() {
  const { theme } = useAppTheme();
  const colorScheme = useColorScheme();
  const showDisconnectActionSheet = useDisconnectActionSheet();
  const { screenHorizontalPadding } = useConversationListStyles();

  return (
    <AnimatedVStack
      layout={theme.animation.reanimatedLayoutSpringTransition}
      entering={theme.animation.reanimatedFadeInSpring}
    >
      <TouchableOpacity
        onPress={() => showDisconnectActionSheet(colorScheme)}
        style={{
          width: "100%",
          backgroundColor: theme.colors.background.blurred,
          paddingHorizontal: screenHorizontalPadding,
          paddingVertical: theme.spacing.xs,
        }}
      >
        <VStack>
          <Text size="xs">
            {translate("ephemeral_account_banner.title")}.{" "}
            {translate("ephemeral_account_banner.subtitle")}
          </Text>
        </VStack>
      </TouchableOpacity>
    </AnimatedVStack>
  );
});
