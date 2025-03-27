import { memo, useEffect } from "react"
import {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { AnimatedVStack } from "@/design-system/VStack"
import { useConversationMessageContextStoreContext } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useSelect } from "@/stores/stores.utils"
import { useAppTheme } from "@/theme/use-app-theme"

export const ConversationMessageHighlighted = memo(function ConversationMessageHighlighted(props: {
  children: React.ReactNode
}) {
  const { children } = props
  const { xmtpMessageId } = useConversationMessageContextStoreContext(useSelect(["xmtpMessageId"]))
  const { animatedStyle } = useHighlightAnimation({ messageId: xmtpMessageId })

  return (
    <AnimatedVStack
      style={[
        animatedStyle,
        {
          width: "100%",
        },
      ]}
    >
      {children}
    </AnimatedVStack>
  )
})

type IUseHighlightAnimationArgs = {
  messageId: string
}

function useHighlightAnimation(args: IUseHighlightAnimationArgs) {
  const { messageId } = args
  const { theme } = useAppTheme()
  const conversationStore = useConversationStore()
  const isHighlightedAV = useSharedValue(0)

  useEffect(() => {
    const unsubscribe = conversationStore.subscribe(
      (state) => state.highlightedXmtpMessageId,
      (highlightedMessageId) => {
        cancelAnimation(isHighlightedAV)

        if (!highlightedMessageId) {
          isHighlightedAV.value = withSpring(0, {
            stiffness: theme.animation.spring.stiffness,
            damping: theme.animation.spring.damping,
          })
          return
        }

        if (messageId !== highlightedMessageId) {
          return
        }

        isHighlightedAV.value = withSpring(
          1,
          {
            stiffness: theme.animation.spring.stiffness,
            damping: theme.animation.spring.damping,
          },
          () => {
            runOnJS(conversationStore.setState)({
              highlightedXmtpMessageId: undefined,
            })
          },
        )
      },
    )
    return () => unsubscribe()
  }, [conversationStore, isHighlightedAV, theme, messageId])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHighlightedAV.value, [0, 1], [1, 0.5]),
  }))

  return { animatedStyle }
}
