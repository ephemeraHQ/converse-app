import { useCallback, useRef } from "react"
import {
  FlatListProps,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native"
import Animated, { AnimatedProps } from "react-native-reanimated"
import { AnimatedVStack } from "@/design-system/VStack"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConversationListItemDm } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-dm"
import { ConversationListItemGroup } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-group"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { useAppTheme } from "@/theme/use-app-theme"

type IConversationListProps = Omit<
  AnimatedProps<FlatListProps<IXmtpConversationId>>,
  "data" | "renderItem"
> & {
  conversationsIds: IXmtpConversationId[]
  renderConversation?: ListRenderItem<IXmtpConversationId>
  onRefetch?: () => Promise<void>
}

export function ConversationList(props: IConversationListProps) {
  const {
    conversationsIds: conversationsIds,
    renderConversation = defaultRenderItem,
    onRefetch,
    ...rest
  } = props

  const { theme } = useAppTheme()

  const { onScroll } = useRefreshHandler({
    onRefetch,
  })

  return (
    // @ts-expect-error
    <Animated.FlatList
      onScroll={onScroll}
      keyboardShouldPersistTaps="handled"
      alwaysBounceVertical={conversationsIds?.length > 0}
      layout={theme.animation.reanimatedLayoutSpringTransition}
      itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
      data={conversationsIds}
      keyExtractor={keyExtractor}
      renderItem={(args) => (
        <AnimatedVStack
          entering={theme.animation.reanimatedFadeInSpring}
          exiting={theme.animation.reanimatedFadeOutSpring}
        >
          {renderConversation(args)}
        </AnimatedVStack>
      )}
      {...rest}
    />
  )
}

const defaultRenderItem: ListRenderItem<IXmtpConversationId> = ({ item }) => {
  const currentSender = getSafeCurrentSender()

  const conversation = getConversationQueryData({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId: item,
  })

  if (!conversation) {
    return null
  }

  if (isConversationGroup(conversation)) {
    return <ConversationListItemGroup xmtpConversationId={item} />
  }

  return <ConversationListItemDm xmtpConversationId={item} />
}

function keyExtractor(id: IXmtpConversationId) {
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
