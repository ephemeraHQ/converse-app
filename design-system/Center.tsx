import { ForwardedRef, forwardRef } from "react";
import { View } from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

import { HStack } from "./HStack";

export type ICenterProps = IHStackProps;

export const Center = forwardRef(
  (props: ICenterProps, ref: ForwardedRef<View>) => {
    const { style, ...rest } = props;
    return (
      <HStack
        ref={ref}
        style={[{ alignItems: "center", justifyContent: "center" }, style]}
        {...rest}
      />
    );
  }
);

export type IAnimatedCenterProps = AnimatedProps<ICenterProps>;

export const AnimatedCenter = Animated.createAnimatedComponent(Center);
