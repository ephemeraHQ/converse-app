import { Icon } from "@design-system/Icon/Icon"
import React from "react"
import { ViewStyle } from "react-native"
import {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { AnimatedCenter, Center } from "@/design-system/Center"
import { IIconName, IIconProps } from "@/design-system/Icon/Icon.types"
import { useAppTheme } from "@/theme/use-app-theme"
import { Haptics } from "@/utils/haptics"
import { useConversationListItemSwipeableStyles } from "./conversation-list-item-swipeable.styles"

type IConversationListItemSwipeableActionProps = {
  icon: IIconName
  iconColor?: string
  color: string
  containerStyle?: ViewStyle
  iconProps?: Partial<Omit<IIconProps, "icon" | "picto">>
  actionProgress: SharedValue<number>
}

export function ConversationListItemSwipeableAction({
  icon,
  containerStyle,
  iconColor,
  iconProps,
  color,
  actionProgress,
}: IConversationListItemSwipeableActionProps) {
  const { theme } = useAppTheme()

  const { swipeThreshold } = useConversationListItemSwipeableStyles()

  const scaleAV = useSharedValue(0.5)

  useAnimatedReaction(
    () => actionProgress.value >= 1,
    (isOverThreshold, prevIsOverThreshold) => {
      if (isOverThreshold && !prevIsOverThreshold) {
        Haptics.softImpactAsyncAnimated()
        scaleAV.value = withSpring(1, {
          duration: theme.timing.veryFast,
        })
      } else if (!isOverThreshold && prevIsOverThreshold) {
        Haptics.softImpactAsyncAnimated()
        scaleAV.value = withSpring(0.6, {
          duration: theme.timing.veryFast,
        })
      }
    },
  )

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAV.value }],
    }
  })

  return (
    <Center
      style={[
        {
          width: swipeThreshold,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color,
        },
        containerStyle,
      ]}
    >
      <AnimatedCenter style={iconAnimatedStyle}>
        <Icon icon={icon} color={iconColor} size={theme.iconSize.md} {...iconProps} />
      </AnimatedCenter>
    </Center>
  )
}
