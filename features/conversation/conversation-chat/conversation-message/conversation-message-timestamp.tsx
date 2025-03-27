import { AnimatedHStack } from "@design-system/HStack"
import { AnimatedText, Text } from "@design-system/Text"
import { getTextStyle } from "@design-system/Text/Text.utils"
import { AnimatedVStack } from "@design-system/VStack"
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations"
import { getLocalizedTime, getRelativeDate } from "@utils/date"
import { flattenStyles } from "@utils/styles"
import { isToday, isWithinInterval, subHours } from "date-fns"
import { memo, useEffect } from "react"
import {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { useAppTheme } from "@/theme/use-app-theme"
import {
  useConversationMessageContextStore,
  useConversationMessageContextStoreContext,
} from "./conversation-message.store-context"

// Determines if we should show only time (for messages less than 24h old)
function shouldShowOnlyTime(timestamp: number): boolean {
  const messageDate = new Date(timestamp)
  const now = new Date()

  return isWithinInterval(messageDate, {
    start: subHours(now, 24),
    end: now,
  })
}

// For messages that can be tapped to show time
const MessageTimestampVisible = memo(function MessageTimestamp({
  timestamp,
}: {
  timestamp: number
}) {
  const { theme } = useAppTheme()
  const showTimeAV = useSharedValue(0)
  const messageStore = useConversationMessageContextStore()

  const messageTime = getLocalizedTime(timestamp)
  const showOnlyTime = shouldShowOnlyTime(timestamp)
  const messageDate = showOnlyTime ? messageTime : getRelativeDate(timestamp)

  useEffect(() => {
    const unsubscribe = messageStore.subscribe(
      (state) => state.isShowingTime,
      (isShowingTime) => {
        showTimeAV.value = isShowingTime ? 1 : 0
      },
    )
    return () => unsubscribe()
  }, [messageStore, showTimeAV])

  const timeAnimatedStyle = useAnimatedStyle(() => ({
    display: showTimeAV.value ? "flex" : "none",
    opacity: withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    }),
  }))

  return (
    <AnimatedHStack
      layout={theme.animation.reanimatedLayoutSpringTransition}
      style={{
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        columnGap: theme.spacing["4xs"],
        marginVertical: theme.spacing.sm,
      }}
    >
      <Text preset="smaller" color="secondary">
        {messageDate}
      </Text>
      {!showOnlyTime && (
        <AnimatedText preset="smaller" color="secondary" style={timeAnimatedStyle}>
          {messageTime}
        </AnimatedText>
      )}
    </AnimatedHStack>
  )
})

// For standalone time that's initially hidden
const MessageTimestampHidden = memo(function MessageTimestampHidden({
  timestamp,
}: {
  timestamp: number
}) {
  const { themed, theme } = useAppTheme()
  const showTimeAV = useSharedValue(0)
  const messageStore = useConversationMessageContextStore()

  const messageTime = getLocalizedTime(timestamp)
  const messageDate = isToday(timestamp)
    ? messageTime
    : `${getRelativeDate(timestamp)} ${messageTime}`

  useEffect(() => {
    const unsubscribe = messageStore.subscribe(
      (state) => state.isShowingTime,
      (isShowingTime) => {
        showTimeAV.value = isShowingTime ? 1 : 0
      },
    )
    return () => unsubscribe()
  }, [messageStore, showTimeAV])

  const textHeight = flattenStyles(getTextStyle(themed, { preset: "smaller" })).lineHeight

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    })
  })

  const timeAnimatedStyle = useAnimatedStyle(
    () => ({
      height: interpolate(showTimeProgressAV.value, [0, 1], [0, textHeight || 14]),
      opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
      marginVertical: interpolate(showTimeProgressAV.value, [0, 1], [0, theme.spacing.sm]),
      transform: [
        { scale: showTimeProgressAV.value },
        {
          translateY: interpolate(showTimeProgressAV.value, [0, 1], [theme.spacing.xl, 0]),
        },
      ],
    }),
    [textHeight],
  )

  return (
    <AnimatedVStack
      style={[
        {
          alignItems: "center",
          overflow: "hidden",
          width: "100%",
        },
        timeAnimatedStyle,
      ]}
    >
      <Text preset="smaller" color="secondary">
        {messageDate}
      </Text>
    </AnimatedVStack>
  )
})

export const ConversationMessageTimestamp = memo(function ConversationMessageTimestamp() {
  const [sentAtMs, showDateChange] = useConversationMessageContextStoreContext((s) => [
    s.sentAtMs,
    s.showDateChange,
  ])

  if (showDateChange) {
    return <MessageTimestampVisible timestamp={sentAtMs} />
  }

  return <MessageTimestampHidden timestamp={sentAtMs} />
})
