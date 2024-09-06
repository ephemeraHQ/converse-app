import {
  BACKDROP_DARK_BACKGROUND_COLOR,
  BACKDROP_LIGHT_BACKGROUND_COLOR,
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
  IS_IOS,
  WINDOW_HEIGHT,
} from "@utils/contextMenu/contstants";
import { BlurView } from "expo-blur";
import React, { memo } from "react";
import { StyleSheet } from "react-native";
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useInternal } from "./useInternal";

const AnimatedBlurView = IS_IOS
  ? Animated.createAnimatedComponent(BlurView)
  : Animated.View;

type Context = {
  startPosition: {
    x: number;
    y: number;
  };
};

const BackdropComponent = () => {
  const { state, theme } = useInternal();
  console.log("here1111 state", state.value);

  const tapGestureEvent = useAnimatedGestureHandler<
    TapGestureHandlerGestureEvent,
    Context
  >(
    {
      onStart: (event, context) => {
        console.log("here1111 onStart");
        context.startPosition = { x: event.x, y: event.y };
      },
      onCancel: () => {
        console.log("here1111 onCancel");
        state.value = CONTEXT_MENU_STATE.END;
      },
      onEnd: (event, context) => {
        console.log("here1111 onEnd");
        const distance = Math.hypot(
          event.x - context.startPosition.x,
          event.y - context.startPosition.y
        );
        const shouldClose = distance < 10;
        const isStateActive = state.value === CONTEXT_MENU_STATE.ACTIVE;

        if (shouldClose && isStateActive) {
          state.value = CONTEXT_MENU_STATE.END;
        }
      },
    },
    [state]
  );

  const animatedContainerStyle = useAnimatedStyle(() => {
    const topValueAnimation = () =>
      state.value === CONTEXT_MENU_STATE.ACTIVE
        ? 0
        : withDelay(
            HOLD_ITEM_TRANSFORM_DURATION,
            withTiming(WINDOW_HEIGHT, {
              duration: 0,
            })
          );

    const opacityValueAnimation = () =>
      withTiming(state.value === CONTEXT_MENU_STATE.ACTIVE ? 1 : 0, {
        duration: HOLD_ITEM_TRANSFORM_DURATION,
      });

    return {
      top: topValueAnimation(),
      opacity: opacityValueAnimation(),
    };
  });

  const animatedContainerProps = useAnimatedProps(() => {
    return {
      intensity: withTiming(
        state.value === CONTEXT_MENU_STATE.ACTIVE ? 100 : 0,
        {
          duration: HOLD_ITEM_TRANSFORM_DURATION,
        }
      ),
    };
  });

  const animatedInnerContainerStyle = useAnimatedStyle(() => {
    const backgroundColor =
      theme.value === "light"
        ? BACKDROP_LIGHT_BACKGROUND_COLOR
        : BACKDROP_DARK_BACKGROUND_COLOR;

    return { backgroundColor };
  }, [theme]);

  return (
    <TapGestureHandler
      onGestureEvent={tapGestureEvent}
      onHandlerStateChange={tapGestureEvent}
    >
      <AnimatedBlurView
        tint="default"
        animatedProps={animatedContainerProps}
        style={[styles.container, animatedContainerStyle]}
      >
        <Animated.View
          style={[
            { ...StyleSheet.absoluteFillObject },
            animatedInnerContainerStyle,
          ]}
        />
      </AnimatedBlurView>
    </TapGestureHandler>
  );
};

export const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});

export const HoldItemBackdrop = memo(BackdropComponent);
