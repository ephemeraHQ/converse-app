import React, { memo, useEffect } from "react"
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { AnimatedCenter } from "@/design-system/Center"
import { AnimatedHStack } from "@/design-system/HStack"
import { Icon } from "@/design-system/Icon/Icon"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useConversationListStyles } from "@/features/conversation/conversation-list/conversation-list.styles"
import { useAppTheme } from "@/theme/use-app-theme"

export const ConversationListStartNewConvoBanner = memo(
  function ConversationListStartNewConvoBanner() {
    const { theme } = useAppTheme()
    const { screenHorizontalPadding } = useConversationListStyles()

    const bounceTranslateYAV = useSharedValue(0)

    const as = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: bounceTranslateYAV.value }],
      }
    }, [])

    useEffect(() => {
      const timingConfig = {
        duration: theme.timing.slow,
      }
      bounceTranslateYAV.value = withSequence(
        withTiming(0, timingConfig),
        withRepeat(withTiming(-theme.spacing.xs, timingConfig), -1, true),
      )
    }, [bounceTranslateYAV, theme])

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
          <Icon size={theme.iconSize.md} color={theme.colors.text.secondary} icon="chevron.up" />
        </AnimatedCenter>
      </AnimatedHStack>
    )
  },
)
