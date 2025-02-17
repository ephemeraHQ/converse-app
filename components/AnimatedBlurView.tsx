import { BlurView, BlurViewProps } from "expo-blur";
import { Platform, View, ViewProps } from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

type AnimatedBlurProps = {
  intensity?: number;
};

type AnimatedBlurViewProps = ViewProps &
  BlurViewProps & {
    animatedProps?: AnimatedProps<AnimatedBlurProps>;
  };

// If BlurView is fixed on Android,
// we only need to update this file to apply the changes across the app
const AnimatedBlurViewComponent = Animated.createAnimatedComponent(
  Platform.OS === "ios" ? BlurView : View
);

export const AnimatedBlurView: React.FC<AnimatedBlurViewProps> = (
  args: AnimatedBlurViewProps
) => {
  const { animatedProps, ...props } = args;
  return <AnimatedBlurViewComponent {...props} animatedProps={animatedProps} />;
};
