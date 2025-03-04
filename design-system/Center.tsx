import { ForwardedRef, forwardRef } from "react"
import { View } from "react-native"
import Animated, { AnimatedProps } from "react-native-reanimated"
import { HStack, IHStackProps } from "./HStack"
import { VStack } from "./VStack"

export type ICenterProps = IHStackProps & {
  vertical?: boolean
}

export const Center = forwardRef((props: ICenterProps, ref: ForwardedRef<View>) => {
  const { style, vertical = false, ...rest } = props

  const Stack = vertical ? VStack : HStack

  return (
    <Stack
      ref={ref}
      style={[{ alignItems: "center", justifyContent: "center" }, style]}
      {...rest}
    />
  )
})

export type IAnimatedCenterProps = AnimatedProps<ICenterProps>

export const AnimatedCenter = Animated.createAnimatedComponent(Center)
