import { BlurViewProps, BlurView as RNBlurView } from "expo-blur";
import { memo } from "react";
import Animated, { AnimatedProps } from "react-native-reanimated";

import { IVStackProps } from "./VStack";

const AnimatedBlurView = Animated.createAnimatedComponent(RNBlurView);

export type IBlurViewProps = IVStackProps &
  AnimatedProps<BlurViewProps> & { isAbsolute?: boolean };

export const BlurView = memo(function BlurView({
  children,
  isAbsolute,
  style,
  ...rest
}: IBlurViewProps) {
  return (
    <AnimatedBlurView
      intensity={80}
      tint="dark"
      style={[
        style,
        isAbsolute && {
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          left: 0,
        },
      ]}
      // On my Android, this cause the screen to be all white. So wait until it's out of experimental to try it agian
      // {...(env.isAndroid &&
      //   !env.isNotPerformanceDevice && {
      //     experimentalBlurMethod: "dimezisBlurView",
      //   })}
      {...rest}
    >
      {children}
    </AnimatedBlurView>
  );
});
