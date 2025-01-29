import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { AnimatedCenter, Center } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { useHeaderHeight } from "@/design-system/Header/Header.utils";
import { Icon } from "@/design-system/Icon/Icon";
import { AnimatedText, Text } from "@/design-system/Text";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { Loader } from "@/design-system/loader";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { ConversationListItemDm } from "@/features/conversation-list/conversation-list-item/conversation-list-item-dm";
import { ConversationListItemGroup } from "@/features/conversation-list/conversation-list-item/conversation-list-item-group";
import { ConversationListPinnedConversations } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations";
import { useConversationListStyles } from "@/features/conversation-list/conversation-list.styles";
import {
  useDmConversationContextMenuViewProps,
  useGroupConversationContextMenuViewProps,
} from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-props";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { debugBorder } from "@/utils/debug-style";
import {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo, useCallback, useEffect } from "react";
import { ContextMenuView } from "react-native-ios-context-menu";
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConversationListAwaitingRequests } from "./conversation-list-awaiting-requests";
import { ConversationListEmpty } from "./conversation-list-empty";
import { useHeaderWrapper } from "./conversation-list.screen-header";
import { useConversationListConversations } from "./use-conversation-list-conversations";
import { ConversationListLoading } from "@/features/conversation-list/conversation-list-loading";

type IConversationListProps = NativeStackScreenProps<
  NavigationParamList,
  "Chats"
>;

export function ConversationListScreen(props: IConversationListProps) {
  const {
    data: conversations,
    refetch: refetchConversations,
    isLoading,
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

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      {!isLoading ? (
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

  const { data: conversations } = useConversationListConversations();
  const hasConversations = conversations && conversations.length > 0;

  return (
    <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
      {/* {ephemeralAccount && <EphemeralAccountBanner />} */}
      {!hasConversations && <StartNewConversationBanner />}
      <ConversationListPinnedConversations />
      <ConversationListAwaitingRequests />
    </AnimatedVStack>
  );
});

const StartNewConversationBanner = memo(function StartNewConversationBanner() {
  const { theme } = useAppTheme();
  const { screenHorizontalPadding } = useConversationListStyles();

  const bounceTranslateYAV = useSharedValue(0);

  const as = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bounceTranslateYAV.value }],
    };
  }, []);

  useEffect(() => {
    const timingConfig = {
      // cubic-bezier(.35,.7,.5,.7)
      duration: theme.timing.slow,
    };
    bounceTranslateYAV.value = withSequence(
      withTiming(0, timingConfig),
      withRepeat(withTiming(-theme.spacing.xs, timingConfig), -1, true)
    );
  }, [bounceTranslateYAV, theme]);

  return (
    <AnimatedHStack
      entering={theme.animation.reanimatedFadeInSpring}
      exiting={theme.animation.reanimatedFadeOutSpring}
      style={{
        backgroundColor: theme.colors.fill.minimal,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.xxs,
        columnGap: theme.spacing.sm,
        alignItems: "center",
        marginHorizontal: screenHorizontalPadding,
        marginBottom: theme.spacing.xs,
      }}
    >
      <VStack
        style={{
          rowGap: theme.spacing.xxxs,
          flex: 1,
        }}
      >
        <Text preset="bodyBold">Start a conversation</Text>
        <Text color="secondary" preset="small">
          Invite a friend, or send a message
        </Text>
      </VStack>
      <AnimatedCenter style={as}>
        <Icon
          size={theme.iconSize.md}
          color={theme.colors.text.secondary}
          icon="chevron.up"
        />
      </AnimatedCenter>
    </AnimatedHStack>
  );
});

// const EphemeralAccountBanner = React.memo(function EphemeralAccountBanner() {
//   const { theme } = useAppTheme();
//   const colorScheme = useColorScheme();
//   const showDisconnectActionSheet = useDisconnectActionSheet();
//   const { screenHorizontalPadding } = useConversationListStyles();

//   return (
//     <AnimatedVStack
//       layout={theme.animation.reanimatedLayoutSpringTransition}
//       entering={theme.animation.reanimatedFadeInSpring}
//     >
//       <TouchableOpacity
//         onPress={() => showDisconnectActionSheet(colorScheme)}
//         style={{
//           width: "100%",
//           backgroundColor: theme.colors.background.blurred,
//           paddingHorizontal: screenHorizontalPadding,
//           paddingVertical: theme.spacing.xs,
//         }}
//       >
//         <VStack>
//           <Text size="xs">
//             {translate("ephemeral_account_banner.title")}.{" "}
//             {translate("ephemeral_account_banner.subtitle")}
//           </Text>
//         </VStack>
//       </TouchableOpacity>
//     </AnimatedVStack>
//   );
// });
