import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { memo, useCallback, useEffect } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Screen } from "@/components/screen/screen"
import { ContextMenuView } from "@/design-system/context-menu/context-menu"
import { HStack } from "@/design-system/HStack"
import { AnimatedVStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { prefetchConversationMessages } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { ConversationListItemDm } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-dm"
import { ConversationListItemGroup } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-group"
import { ConversationListLoading } from "@/features/conversation/conversation-list/conversation-list-loading"
import { ConversationListPinnedConversations } from "@/features/conversation/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations"
import { ConversationList } from "@/features/conversation/conversation-list/conversation-list.component"
import {
  useDmConversationContextMenuViewProps,
  useGroupConversationContextMenuViewProps,
} from "@/features/conversation/conversation-list/hooks/use-conversation-list-item-context-menu-props"
import { usePinnedConversations } from "@/features/conversation/conversation-list/hooks/use-pinned-conversations"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { isTempConversation } from "@/features/conversation/utils/is-temp-conversation"
import { IDm } from "@/features/dm/dm.types"
import { IGroup } from "@/features/groups/group.types"
import { subscribeToNotificationTopicsWithMetadata } from "@/features/notifications/notifications.api"
import { getXmtpConversationHmacKeys } from "@/features/xmtp/xmtp-hmac-keys/xmtp-hmac-keys"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { useMinimumLoadingTime } from "@/hooks/use-minimum-loading-time"
import { NavigationParamList } from "@/navigation/navigation.types"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import logger from "@/utils/logger"
import { ConversationListAwaitingRequests } from "./conversation-list-awaiting-requests"
import { ConversationListEmpty } from "./conversation-list-empty"
import { ConversationListStartNewConvoBanner } from "./conversation-list-start-new-convo-banner"
import { useConversationListScreenHeader } from "./conversation-list.screen-header"
import { useConversationListConversations } from "./hooks/use-conversation-list-conversations"

type IConversationListProps = NativeStackScreenProps<NavigationParamList, "Chats">

export function ConversationListScreen(props: IConversationListProps) {
  const currentSender = useSafeCurrentSender()

  const {
    data: conversationsIds,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
  } = useConversationListConversations()

  const { theme } = useAppTheme()

  const insets = useSafeAreaInsets()

  useConversationListScreenHeader()

  // Subscribe to notifications
  useEffect(() => {
    // https://docs.xmtp.org/inboxes/push-notifs/push-notifs
    async function subscribeToConversation(conversationId: IXmtpConversationId) {
      logger.debug("[ConversationList] Subscribing to conversation", {
        conversationId,
        inboxId: currentSender.inboxId,
      })

      const conversation = getConversationQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
      })

      if (!conversation) {
        logger.debug("[ConversationList] No conversation found, skipping subscription", {
          conversationId,
        })
        return
      }

      logger.debug("[ConversationList] Getting installation ID")
      const installationId = await ensureXmtpInstallationQueryData({
        inboxId: currentSender.inboxId,
      })

      logger.debug("[ConversationList] Getting HMAC keys", {
        conversationId,
      })
      const hmacKeys = await getXmtpConversationHmacKeys({
        clientInboxId: currentSender.inboxId,
        conversationId,
      })

      logger.debug("[ConversationList] Subscribing to notification topics", {
        installationId,
        topic: hmacKeys.topic,
      })
      subscribeToNotificationTopicsWithMetadata({
        installationId,
        subscriptions: [
          {
            topic: hmacKeys.topic,
            isSilent: false,
            hmacKeys: hmacKeys.hmacKeys,
          },
        ],
      })

      logger.debug("[ConversationList] Successfully subscribed to conversation", {
        conversationId,
      })
    }

    for (const conversationId of conversationsIds) {
      subscribeToConversation(conversationId).catch(captureError)
    }
  }, [conversationsIds, currentSender.inboxId])

  // Let's prefetch the messages for all the conversations
  useEffect(() => {
    if (conversationsIds) {
      for (const conversationId of conversationsIds) {
        if (isTempConversation(conversationId)) {
          return
        }
        prefetchConversationMessages({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: conversationId,
          caller: "useConversationListConversations",
        }).catch(captureError)
      }
    }
  }, [conversationsIds, currentSender])

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
      {isLoading && conversationsIds?.length === 0 ? (
        <ConversationListLoading />
      ) : (
        <ConversationList
          conversationsIds={conversationsIds ?? []}
          scrollEnabled={conversationsIds && conversationsIds?.length > 0}
          ListEmptyComponent={<ConversationListEmpty />}
          ListHeaderComponent={<ListHeader />}
          onRefetch={handleRefresh}
          onLayout={() => {}}
          initialNumToRender={10} // 10 should be enough to cover the screen
          layout={theme.animation.reanimatedLayoutSpringTransition}
          contentContainerStyle={{
            flexGrow: 1, // For the empty state to be full screen
            // Little hack because we want ConversationListEmpty to be full screen when we have no conversations
            paddingBottom: conversationsIds && conversationsIds.length > 0 ? insets.bottom : 0,
          }}
          renderConversation={({ item }) => {
            const conversation = getConversationQueryData({
              clientInboxId: currentSender.inboxId,
              xmtpConversationId: item,
            })

            if (!conversation) {
              return null
            }

            return isConversationGroup(conversation) ? (
              <ConversationListItemGroupWrapper group={conversation} />
            ) : (
              <ConversationListItemDmWrapper dm={conversation} />
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
    xmtpConversationId: dm.xmtpId,
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
        <ConversationListItemDm xmtpConversationId={dm.xmtpId} />
      </ContextMenuView>
    </HStack>
  )
})

const ConversationListItemGroupWrapper = memo(function ConversationListItemGroupWrapper(props: {
  group: IGroup
}) {
  const { group } = props

  const contextMenuProps = useGroupConversationContextMenuViewProps({
    xmtpConversationId: group.xmtpId,
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
        <ConversationListItemGroup xmtpConversationId={group.xmtpId} />
      </ContextMenuView>
    </HStack>
  )
})

const ListHeader = React.memo(function ListHeader() {
  const { theme } = useAppTheme()

  const { data: conversations } = useConversationListConversations()
  const { pinnedConversationsIds: pinnedConversations } = usePinnedConversations()
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
