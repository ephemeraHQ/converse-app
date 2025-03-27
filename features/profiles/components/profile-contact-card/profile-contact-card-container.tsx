import React, { memo } from "react"
import { Dimensions, ViewStyle } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { IAnimatedVStackProps } from "@/design-system/VStack"
import { useProfileContactCardStyles } from "@/features/profiles/components/profile-contact-card/use-profile-contact-card.styles"
import { useAppTheme } from "@/theme/use-app-theme"

/**
 * AnimatedCardContainer Component
 *
 * A component that provides 3D card animation with gesture detection.
 * Uses theme's inverted colors to create a dark card on light background.
 */
export const ProfileContactCardContainer = memo(function ProfileContactCardContainer({
  children,
  style,
  ...props
}: IAnimatedVStackProps) {
  const { theme } = useAppTheme()
  const { width: screenWidth } = Dimensions.get("window")
  const { container } = useProfileContactCardStyles()

  const rotateX = useSharedValue(0)
  const rotateY = useSharedValue(0)
  const shadowOffsetX = useSharedValue(0)
  const shadowOffsetY = useSharedValue(6)

  const baseStyle: ViewStyle = {
    backgroundColor: theme.colors.fill.primary,
    borderRadius: theme.borderRadius.xxs,
    padding: theme.spacing.lg,
    margin: container.margin, // For shadow to show well
    shadowColor: theme.colors.fill.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    // Maintains credit card aspect ratio
    height: (screenWidth - 2 * theme.spacing.lg) * 0.64,
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
    shadowOffset: {
      width: shadowOffsetX.value,
      height: shadowOffsetY.value,
    },
  }))

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      rotateX.value = withSpring(0)
      rotateY.value = withSpring(0)
      shadowOffsetX.value = withSpring(0)
      shadowOffsetY.value = withSpring(0)
    })
    .onUpdate((event) => {
      rotateX.value = event.translationY / 10
      rotateY.value = event.translationX / 10
      shadowOffsetX.value = -event.translationX / 20
      shadowOffsetY.value = event.translationY / 20
    })
    .onEnd(() => {
      rotateX.value = withSpring(0)
      rotateY.value = withSpring(0)
      shadowOffsetX.value = withSpring(0)
      shadowOffsetY.value = withSpring(0)
    })

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[baseStyle, animatedStyle, style]} {...props}>
        {children}
      </Animated.View>
    </GestureDetector>
  )
})
