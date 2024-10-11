import Animated, { AnimatedProps } from "react-native-reanimated";

import { Text } from "./Text";
import { ITextProps } from "./Text.props";

export type IAnimatedTextProps = AnimatedProps<ITextProps>;

export const AnimatedText = Animated.createAnimatedComponent(Text);
