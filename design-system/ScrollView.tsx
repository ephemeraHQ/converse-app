import { ScrollView as RNScrollView, ScrollViewProps } from "react-native"
import Animated, { AnimatedProps } from "react-native-reanimated"

export type IScrollViewProps = ScrollViewProps

export const ScrollView = RNScrollView

export type IAnimatedScrollViewProps = AnimatedProps<IScrollViewProps>

export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)
