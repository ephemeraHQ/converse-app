import React, { ForwardedRef, forwardRef, memo } from "react"
import { View, ViewProps } from "react-native"
import Animated, { AnimatedProps } from "react-native-reanimated"

export type IHStackProps = ViewProps

export const HStack = memo(
  forwardRef((props: IHStackProps, ref: ForwardedRef<View>) => {
    return (
      <View
        ref={ref}
        {...props}
        style={[
          {
            flexDirection: "row",
          },
          props.style,
        ]}
      />
    )
  }),
)

export type IAnimatedHStackProps = AnimatedProps<IHStackProps>

export const AnimatedHStack = Animated.createAnimatedComponent(HStack)
