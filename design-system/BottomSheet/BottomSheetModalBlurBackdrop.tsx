import { BottomSheetBackdropProps, useBottomSheet } from "@gorhom/bottom-sheet"
import React, { memo, useCallback } from "react"
import { StyleSheet } from "react-native"
import { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { BlurView } from "../BlurView"
import { Pressable } from "../Pressable"
import { AnimatedVStack } from "../VStack"

type IBottomSheetBlurBackdropProps = BottomSheetBackdropProps & {
  children?: React.ReactNode
  onPress?: () => void
}

export const BottomSheetBlurBackdrop = memo(function BottomSheetBlurBackdrop(
  props: IBottomSheetBlurBackdropProps,
) {
  const { animatedIndex, style, children, onPress } = props

  const { close } = useBottomSheet()

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 1], [0, 1], "clamp"),
  }))

  const handlePressBackdrop = useCallback(() => {
    if (onPress) {
      onPress()
    } else {
      close()
    }
  }, [onPress, close])

  return (
    <AnimatedVStack
      style={[
        {
          ...StyleSheet.absoluteFillObject,
        },
        containerAnimatedStyle,
        style,
      ]}
    >
      <BlurView isAbsolute>
        <Pressable
          style={{
            flex: 1,
          }}
          onPress={handlePressBackdrop}
        >
          {children}
        </Pressable>
      </BlurView>
    </AnimatedVStack>
  )
})
