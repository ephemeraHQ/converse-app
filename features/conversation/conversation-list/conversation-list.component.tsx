import { FlashList, FlashListProps, ListRenderItem } from "@shopify/flash-list"
import { useCallback, useRef } from "react"
import { NativeScrollEvent, NativeSyntheticEvent, Platform } from "react-native"
import { AnimatedVStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConversationListItemDm } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-dm"
import { ConversationListItemGroup } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-group"
import { useConversationQuery } from "@/features/conversation/queries/conversation.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { useAppTheme } from "@/theme/use-app-theme"

type IConversationListProps = Omit<FlashListProps<IXmtpConversationId>, "data" | "renderItem"> & {
  conversationsIds: IXmtpConversationId[]
  renderConversation?: ListRenderItem<IXmtpConversationId>
  onRefetch?: () => Promise<void>
}

export function ConversationList(props: IConversationListProps) {
  const { conversationsIds, renderConversation, onRefetch, ...rest } = props

  const { theme } = useAppTheme()

  const { onScroll } = useRefreshHandler({
    onRefetch,
  })

  return (
    <FlashList
      onScroll={onScroll}
      data={conversationsIds}
      keyExtractor={keyExtractor}
      estimatedItemSize={100}
      renderItem={(args) => {
        return (
          <AnimatedVStack
            entering={theme.animation.reanimatedFadeInSpring}
            exiting={theme.animation.reanimatedFadeOutSpring}
          >
            {renderConversation ? (
              renderConversation(args)
            ) : (
              <DefaultConversationItem xmtpConversationId={args.item} />
            )}
          </AnimatedVStack>
        )
      }}
      {...rest}
    />
  )
}

function DefaultConversationItem(props: { xmtpConversationId: IXmtpConversationId }) {
  const { xmtpConversationId } = props

  const currentSender = useSafeCurrentSender()

  const { data: conversation } = useConversationQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "useDefaultRenderItem",
  })

  if (!conversation) {
    return null
  }

  if (isConversationGroup(conversation)) {
    return <ConversationListItemGroup xmtpConversationId={xmtpConversationId} />
  }

  return <ConversationListItemDm xmtpConversationId={xmtpConversationId} />
}

function keyExtractor(id: IXmtpConversationId): string {
  return id
}

function useRefreshHandler(args: { onRefetch?: () => Promise<void> }) {
  const { onRefetch } = args

  const isRefetchingRef = useRef(false)

  const handleRefresh = useCallback(async () => {
    if (isRefetchingRef.current) return
    isRefetchingRef.current = true
    try {
      await onRefetch?.()
    } catch (error) {
      throw error
    } finally {
      isRefetchingRef.current = false
    }
  }, [onRefetch])

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isRefetchingRef.current) return
      // iOS has it's own bounce and search bar, so we need to set a different threshold
      // Android does not have a bounce, so this will never really get hit.
      const threshold = Platform.OS === "ios" ? -190 : 0
      const isAboveThreshold = e.nativeEvent.contentOffset.y < threshold
      if (isAboveThreshold) {
        handleRefresh()
      }
    },
    [handleRefresh],
  )

  return {
    onScroll,
    handleRefresh,
  }
}
