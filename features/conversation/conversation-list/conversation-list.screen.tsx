import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { memo, useCallback } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Screen } from "@/components/screen/screen"
import { ContextMenuView } from "@/design-system/context-menu/context-menu"
import { HStack } from "@/design-system/HStack"
import { AnimatedVStack } from "@/design-system/VStack"
import { ConversationList } from "@/features/conversation/conversation-list/conversation-list"
import { ConversationListItemDm } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-dm"
import { ConversationListItemGroup } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-group"
import { ConversationListLoading } from "@/features/conversation/conversation-list/conversation-list-loading"
import { ConversationListPinnedConversations } from "@/features/conversation/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations"
import {
  useDmConversationContextMenuViewProps,
  useGroupConversationContextMenuViewProps,
} from "@/features/conversation/conversation-list/hooks/use-conversation-list-item-context-menu-props"
import { usePinnedConversations } from "@/features/conversation/conversation-list/hooks/use-pinned-conversations"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { IDm } from "@/features/dm/dm.types"
import { IGroup } from "@/features/groups/group.types"
import { useMinimumLoadingTime } from "@/hooks/use-minimum-loading-time"
import { NavigationParamList } from "@/navigation/navigation.types"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import { ConversationListAwaitingRequests } from "./conversation-list-awaiting-requests"
import { ConversationListEmpty } from "./conversation-list-empty"
import { ConversationListStartNewConvoBanner } from "./conversation-list-start-new-convo-banner"
import { useConversationListScreenHeader } from "./conversation-list.screen-header"
import { useConversationListConversations } from "./use-conversation-list-conversations"

type IConversationListProps = NativeStackScreenProps<NavigationParamList, "Chats">

export function ConversationListScreen(props: IConversationListProps) {
  const {
    data: conversations,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
  } = useConversationListConversations()

  const { theme } = useAppTheme()

  const insets = useSafeAreaInsets()

  useConversationListScreenHeader()

  const handleRefresh = useCallback(async () => {
    try {
      await refetchConversations()
    } catch (error) {
      captureError(error)
    }
  }, [refetchConversations])

  // Better UX to at least show loading for 2 seconds
  // Or don't show if loading is quick (< 500ms)
  const isLoading = useMinimumLoadingTime({
    isLoading: isLoadingConversations,
    minTimeBeforeShowing: __DEV__ ? 0 : 500,
    minimumLoadingDuration: __DEV__ ? 0 : 2000,
  })

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
          initialNumToRender={10} // 10 should be enough to cover the screen
          layout={theme.animation.reanimatedLayoutSpringTransition}
          contentContainerStyle={{
            flexGrow: 1, // For the empty state to be full screen
            // Little hack because we want ConversationListEmpty to be full screen when we have no conversations
            paddingBottom: conversations && conversations.length > 0 ? insets.bottom : 0,
          }}
          renderConversation={({ item }) => {
            return isConversationGroup(item) ? (
              <ConversationListItemGroupWrapper group={item} />
            ) : (
              <ConversationListItemDmWrapper dm={item} />
            )
          }}
        />
      )}
    </Screen>
  )
}

const ConversationListItemDmWrapper = memo(function ConversationListItemDmWrapper(props: {
  dm: IDm
}) {
  const { dm } = props

  const contextMenuProps = useDmConversationContextMenuViewProps({
    dmConversationTopic: dm.topic,
  })

  return (
    // Needed this so we don't see the shadow when long press to open the context menu
    <HStack
      style={{
        width: "100%",
        overflow: "hidden",
      }}
    >
      <ContextMenuView
        style={{
          width: "100%",
        }}
        {...contextMenuProps}
      >
        <ConversationListItemDm conversationTopic={dm.topic} />
      </ContextMenuView>
    </HStack>
  )
})

const ConversationListItemGroupWrapper = memo(function ConversationListItemGroupWrapper(props: {
  group: IGroup
}) {
  const { group } = props

  const contextMenuProps = useGroupConversationContextMenuViewProps({
    groupConversationTopic: group.topic,
  })

  return (
    // Needed this so we don't see the shadow when long press to open the context menu
    <HStack
      style={{
        width: "100%",
        overflow: "hidden",
      }}
    >
      <ContextMenuView
        style={{
          width: "100%",
        }}
        {...contextMenuProps}
      >
        <ConversationListItemGroup conversationTopic={group.topic} />
      </ContextMenuView>
    </HStack>
  )
})

const ListHeader = React.memo(function ListHeader() {
  const { theme } = useAppTheme()

  const { data: conversations } = useConversationListConversations()
  const { pinnedConversations } = usePinnedConversations()
  const hasNoConversations =
    conversations &&
    conversations.length === 0 &&
    pinnedConversations &&
    pinnedConversations.length === 0

  return (
    <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
      {/* {ephemeralAccount && <EphemeralAccountBanner />} */}
      {hasNoConversations && <ConversationListStartNewConvoBanner />}
      <ConversationListPinnedConversations />
      <ConversationListAwaitingRequests />
    </AnimatedVStack>
  )
})
