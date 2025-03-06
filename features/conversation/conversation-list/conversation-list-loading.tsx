import React, { memo, useEffect } from "react"
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AnimatedTextCarousel } from "@/components/animated-text-carousel"
import { useHeaderHeight } from "@/design-system/Header/Header.utils"
import { Loader } from "@/design-system/loader"
import { Text } from "@/design-system/Text"
import { AnimatableText } from "@/design-system/Text/AnimatedText"
import { getTextStyle } from "@/design-system/Text/Text.utils"
import { AnimatedVStack, VStack } from "@/design-system/VStack"
import { ConversationListEmpty } from "@/features/conversation/conversation-list/conversation-list-empty"
import { translate } from "@/i18n"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"

export const ConversationListLoading = memo(function ConversationListLoading() {
  const { theme, themed } = useAppTheme()

  const headerHeight = useHeaderHeight()

  const insets = useSafeAreaInsets()

  return (
    <AnimatedVStack
      style={$globalStyles.flex1}
      entering={theme.animation.reanimatedFadeInSpring}
      exiting={theme.animation.reanimatedFadeOutSpring}
    >
      <ConversationListEmpty />
      <VStack
        style={[
          $globalStyles.absoluteFill,
          {
            rowGap: theme.spacing.sm,
            alignItems: "center",
            justifyContent: "center",
            // To make sure the loader is centered based on the screen height
            bottom: headerHeight + insets.top,
          },
        ]}
      >
        <Loader size="lg" />
        <VStack
          style={{
            rowGap: theme.spacing.xxxs,
            alignItems: "center",
          }}
        >
          {/* <Text preset="bodyBold">Hello</Text> */}
          <AnimatedTextCarousel
            texts={["Hello", "Bonjour", "Ciao", "Hola"]}
            textStyle={getTextStyle(themed, {
              preset: "bodyBold",
            })}
            msDelayBetweenTextChange={2000}
          />
          <Text color="secondary" preset="small">
            {translate("Gathering your messages")}
          </Text>
        </VStack>
        <TimeCounter />
      </VStack>
    </AnimatedVStack>
  )
})

const TimeCounter = memo(function TimeCounter() {
  const { themed } = useAppTheme()

  const counterAV = useSharedValue(0)

  useEffect(() => {
    counterAV.value = withTiming(60 * 5, {
      duration: 60000 * 5, // max of 5 minutes
      easing: Easing.linear,
    })

    return () => {
      cancelAnimation(counterAV)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const countTextAV = useDerivedValue(() => {
    const count = counterAV.value
    const minutes = 0
    const seconds = Math.floor(count)
    const milliseconds = Math.floor((count % 1) * 1000)

    // We want format to be 00:00:000
    return `${String(minutes).padStart(2, "0")}.${String(seconds).padStart(
      2,
      "0",
    )}.${String(milliseconds).padStart(3, "0")}`
  })

  const textStyle = getTextStyle(themed, {
    preset: "smaller",
    color: "tertiary",
  })

  return (
    <AnimatableText
      style={[
        textStyle,
        {
          textAlign: "center",
          alignSelf: "center",
          fontVariant: ["tabular-nums"], // Uses monospaced numbers where all digits have the same width (e.g., '1' and '8' take up equal space)
        },
      ]}
      text={countTextAV}
    />
  )
})
