import Animated, { AnimatedProps } from "react-native-reanimated"
import { IconButton } from "./IconButton"
import { IIconButtonProps } from "./IconButton.props"

export type IAnimatedIconButtonProps = AnimatedProps<IIconButtonProps>

export const AnimatedIconButton = Animated.createAnimatedComponent(IconButton)
