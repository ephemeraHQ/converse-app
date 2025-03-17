// import { LegendListProps, LegendListRef } from "@legendapp/list"
// import { AnimatedLegendList } from "@legendapp/list/reanimated"
import { memo, ReactElement, useEffect } from "react"
import { FlatList, FlatListProps, Platform } from "react-native"
import Animated, { AnimatedProps, useAnimatedRef } from "react-native-reanimated"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { IConversationMessage } from "./conversation-message/conversation-message.types"

type ConversationMessagesListProps = Omit<
  AnimatedProps<FlatListProps<IConversationMessage>>,
  "renderItem" | "data"
> & {
  messages: IConversationMessage[]
  renderMessage: (args: { message: IConversationMessage; index: number }) => ReactElement
}

export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: ConversationMessagesListProps,
) {
  const { messages, renderMessage, ...rest } = props
  const { theme } = useAppTheme()
  const scrollRef = useAnimatedRef<FlatList>()
  const conversationStore = useConversationStore()

  useEffect(() => {
    const unsub = conversationStore.subscribe(
      (state) => state.scrollToXmtpMessageId,
      (scrollToXmtpMessageId) => {
        if (!scrollToXmtpMessageId) {
          return
        }

        const index = messages.findIndex((message) => message.xmtpId === scrollToXmtpMessageId)
        if (index === -1) {
          return
        }

        scrollRef.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: 100, // Random value just so that the message is not directly at the bottom
        })

        conversationStore.setState({
          scrollToXmtpMessageId: undefined,
        })
      },
    )

    return () => {
      unsub()
    }
  }, [conversationStore, messages, scrollRef])

  // return (
  //   <AnimatedLegendList
  //     // ref={scrollRef}
  //     data={messages}
  //     renderItem={({ item, index }) =>
  //       renderMessage({
  //         message: item,
  //         index,
  //       })
  //     }
  //     maintainScrollAtEnd
  //     maintainVisibleContentPosition
  //     initialScrollIndex={messages.length - 1}
  //     alignItemsAtEnd
  //     recycleItems={false} // Disable recycling since messages likely have local state
  //     // estimatedItemSize={176} // Random value that feels right
  //     // keyExtractor={keyExtractor}
  //     layout={theme.animation.reanimatedLayoutSpringTransition}
  //     waitForInitialLayout
  //     keyboardDismissMode="interactive"
  //     keyboardShouldPersistTaps="handled"
  //     showsVerticalScrollIndicator={Platform.OS === "ios"} // Size glitch on Android
  //     style={$globalStyles.flex1}
  //     drawDistance={100} // Increase draw distance for better performance when scrolling
  //     {...rest}
  //   />
  // )

  // Slow but works
  return (
    // @ts-expect-error
    <Animated.FlatList
      {...conversationListDefaultProps}
      ref={scrollRef}
      data={messages}
      layout={theme.animation.reanimatedLayoutSpringTransition}
      itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
      renderItem={({ item, index }) =>
        renderMessage({
          message: item,
          index,
        })
      }
      {...rest}
    />
  )
})

const keyExtractor = (message: IConversationMessage) => {
  return message.xmtpId
}

export const conversationListDefaultProps = {
  style: $globalStyles.flex1,
  inverted: true,
  keyboardDismissMode: "interactive" as const,
  keyboardShouldPersistTaps: "handled" as const,
  showsVerticalScrollIndicator: Platform.OS === "ios", // Size glitch on Android
  keyExtractor,
} satisfies Partial<FlatListProps<IConversationMessage>>
