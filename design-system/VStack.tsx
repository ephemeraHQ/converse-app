import React, { ForwardedRef, forwardRef, memo } from "react";
import { View, ViewProps } from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

export type IVStackProps = ViewProps;

export const VStack = memo(
  forwardRef((props: IVStackProps, ref: ForwardedRef<View>) => {
    return (
      <View
        ref={ref}
        {...props}
        style={[
          {
            flexDirection: "column",
          },
          props.style,
        ]}
      />
    );
  })
);

export type IAnimatedVStackProps = AnimatedProps<IVStackProps>;

export const AnimatedVStack = Animated.createAnimatedComponent(VStack);
