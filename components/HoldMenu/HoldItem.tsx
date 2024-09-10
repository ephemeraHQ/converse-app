import { Portal } from "@gorhom/portal";
import { calculateMenuHeight } from "@utils/contextMenu/calculateMenuHeight";
import {
  CONTEXT_MENU_STATE,
  contextMenuStyleGuide,
  HOLD_ITEM_SCALE_DOWN_DURATION,
  HOLD_ITEM_SCALE_DOWN_VALUE,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
} from "@utils/contextMenu/contstants";
import { getTransformOrigin } from "@utils/contextMenu/getTransformOrigin";
import {
  GestureHandlerProps,
  MenuItemProps,
  TransformOriginAnchorPosition,
} from "@utils/contextMenu/types";
import * as Haptics from "expo-haptics";
import { nanoid } from "nanoid/non-secure";
import React, { memo, useMemo } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  ViewProps,
  ViewStyle,
} from "react-native";
import {
  TapGestureHandler,
  LongPressGestureHandler,
  TapGestureHandlerGestureEvent,
  LongPressGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  measure,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSequence,
  withSpring,
  useAnimatedReaction,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useInternal } from "./useInternal";

// import {
//   TransformOriginAnchorPosition,
//   getTransformOrigin,
//   calculateMenuHeight,
// } from "../../utils/calculations";

type Context = { didMeasureLayout: boolean };

interface HoldItemProps {
  items: MenuItemProps[];
  actionParams?: {
    [name: string]: any[];
  };

  children: React.ReactElement | React.ReactElement[];
  menuAnchorPosition?: TransformOriginAnchorPosition;
  disableMove?: boolean;
  containerStyles?: ViewStyle | ViewStyle[];
  theme?: "light" | "dark";
  bottom?: boolean;
  activateOn?: "tap" | "double-tap" | "hold";
  hapticFeedback?:
    | "None"
    | "Selection"
    | "Light"
    | "Medium"
    | "Heavy"
    | "Success"
    | "Warning"
    | "Error";
  closeOnTap?: boolean;
  longPressMinDurationMs?: number;
}

const HoldItemComponent = ({
  items,
  bottom,
  containerStyles,
  disableMove,
  menuAnchorPosition,
  activateOn,
  hapticFeedback,
  actionParams,
  closeOnTap,
  longPressMinDurationMs = 150,
  children,
}: HoldItemProps) => {
  const safeAreaInsets = useSafeAreaInsets();
  const { state, menuProps } = useInternal();
  const isActive = useSharedValue(false);
  const isAnimationStarted = useSharedValue(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const deviceOrientation =
    windowWidth > windowHeight ? "landscape" : "portrait";

  const itemRectY = useSharedValue<number>(0);
  const itemRectX = useSharedValue<number>(0);
  const itemRectWidth = useSharedValue<number>(0);
  const itemRectHeight = useSharedValue<number>(0);
  const itemScale = useSharedValue<number>(1);
  const transformValue = useSharedValue<number>(0);

  const transformOrigin = useSharedValue<TransformOriginAnchorPosition>(
    menuAnchorPosition || "top-right"
  );

  const key = useMemo(() => `hold-item-${nanoid()}`, []);
  const menuHeight = useMemo(() => {
    const itemsWithSeparator = 0; // items.filter((item) => item.withSeparator);
    return calculateMenuHeight(items.length, itemsWithSeparator);
  }, [items]);

  const isHold = !activateOn || activateOn === "hold";

  //#region refs
  const containerRef = useAnimatedRef<Animated.View>();
  //#endregion

  //#region functions
  const hapticResponse = () => {
    const style = !hapticFeedback ? "Medium" : hapticFeedback;
    switch (style) {
      case `Selection`:
        Haptics.selectionAsync();
        break;
      case `Light`:
      case `Medium`:
      case `Heavy`:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
        break;
      case `Success`:
      case `Warning`:
      case `Error`:
        Haptics.notificationAsync(Haptics.NotificationFeedbackType[style]);
        break;
      default:
    }
  };
  //#endregion

  //#region worklet functions
  const activateAnimation = (ctx: any) => {
    "worklet";
    if (!ctx.didMeasureLayout) {
      const measured = measure(containerRef);
      if (!measured) return;

      itemRectY.value = measured.pageY;
      itemRectX.value = measured.pageX;
      itemRectHeight.value = measured.height;
      itemRectWidth.value = measured.width;

      if (!menuAnchorPosition) {
        const position = getTransformOrigin(
          measured.pageX,
          itemRectWidth.value,
          deviceOrientation === "portrait" ? windowWidth : windowHeight,
          bottom
        );
        transformOrigin.value = position;
      }
    }
  };

  const calculateTransformValue = () => {
    "worklet";

    const height =
      deviceOrientation === "portrait" ? windowHeight : windowWidth;

    const isAnchorPointTop = transformOrigin.value.includes("top");

    let tY = 0;
    if (!disableMove) {
      if (isAnchorPointTop) {
        const topTransform =
          itemRectY.value +
          itemRectHeight.value +
          menuHeight +
          contextMenuStyleGuide.spacing +
          (safeAreaInsets?.bottom || 0);

        tY = topTransform > height ? height - topTransform : 0;
      } else {
        const bottomTransform =
          itemRectY.value - menuHeight - (safeAreaInsets?.top || 0);
        tY =
          bottomTransform < 0
            ? -bottomTransform + contextMenuStyleGuide.spacing * 2
            : 0;
      }
    }
    return tY;
  };

  const setMenuProps = () => {
    "worklet";

    menuProps.value = {
      itemHeight: itemRectHeight.value,
      itemWidth: itemRectWidth.value,
      itemY: itemRectY.value,
      itemX: itemRectX.value,
      anchorPosition: transformOrigin.value,
      menuHeight,
      items,
      transformValue: transformValue.value,
      actionParams: actionParams || {},
    };
  };

  const scaleBack = () => {
    "worklet";
    itemScale.value = withTiming(1, {
      duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
    });
  };

  const onCompletion = (isFinised?: boolean) => {
    "worklet";
    const isListValid = items && items.length > 0;
    if (isFinised && isListValid) {
      state.value = CONTEXT_MENU_STATE.ACTIVE;
      isActive.value = true;
      scaleBack();
      if (hapticFeedback !== "None") {
        runOnJS(hapticResponse)();
      }
    }

    isAnimationStarted.value = false;

    // TODO: Warn user if item list is empty or not given
  };

  const scaleHold = () => {
    "worklet";
    itemScale.value = withTiming(
      HOLD_ITEM_SCALE_DOWN_VALUE,
      { duration: HOLD_ITEM_SCALE_DOWN_DURATION },
      onCompletion
    );
  };

  const scaleTap = () => {
    "worklet";
    isAnimationStarted.value = true;

    itemScale.value = withSequence(
      withTiming(HOLD_ITEM_SCALE_DOWN_VALUE, {
        duration: HOLD_ITEM_SCALE_DOWN_DURATION,
      }),
      withTiming(
        1,
        {
          duration: HOLD_ITEM_TRANSFORM_DURATION / 2,
        },
        onCompletion
      )
    );
  };

  /**
   * When use tap activation ("tap") and trying to tap multiple times,
   * scale animation is called again despite it is started. This causes a bug.
   * To prevent this, it is better to check is animation already started.
   */
  const canCallActivateFunctions = () => {
    "worklet";
    const willActivateWithTap =
      activateOn === "double-tap" || activateOn === "tap";

    return (
      (willActivateWithTap && !isAnimationStarted.value) || !willActivateWithTap
    );
  };
  //#endregion

  //#region gesture events
  const gestureEvent = useAnimatedGestureHandler<
    LongPressGestureHandlerGestureEvent | TapGestureHandlerGestureEvent,
    Context
  >({
    onActive: (_, context) => {
      if (canCallActivateFunctions()) {
        if (!context.didMeasureLayout) {
          activateAnimation(context);
          transformValue.value = calculateTransformValue();
          setMenuProps();
          context.didMeasureLayout = true;
        }

        if (!isActive.value) {
          if (isHold) {
            scaleHold();
          } else {
            scaleTap();
          }
        }
      }
    },
    onFinish: (_, context) => {
      context.didMeasureLayout = false;
      if (isHold) {
        scaleBack();
      }
    },
  });

  const overlayGestureEvent = useAnimatedGestureHandler<
    TapGestureHandlerGestureEvent,
    Context
  >({
    onActive: (_) => {
      if (closeOnTap) state.value = CONTEXT_MENU_STATE.END;
    },
  });
  //#endregion

  //#region animated styles & props
  const animatedContainerStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(1, { duration: 0 }));

    return {
      opacity: isActive.value ? 0 : animateOpacity(),
      transform: [
        {
          scale: isActive.value
            ? withTiming(1, { duration: HOLD_ITEM_TRANSFORM_DURATION })
            : itemScale.value,
        },
      ],
    };
  });
  const containerStyle = React.useMemo(
    () => [containerStyles, animatedContainerStyle],
    [containerStyles, animatedContainerStyle]
  );

  const animatedPortalStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(0, { duration: 0 }));

    const tY = calculateTransformValue();
    const transformAnimation = () =>
      disableMove
        ? 0
        : isActive.value
        ? withSpring(tY, SPRING_CONFIGURATION)
        : withTiming(-0.1, { duration: HOLD_ITEM_TRANSFORM_DURATION });

    return {
      zIndex: 10,
      position: "absolute",
      top: itemRectY.value,
      left: itemRectX.value,
      width: itemRectWidth.value,
      height: itemRectHeight.value,
      opacity: isActive.value ? 1 : animateOpacity(),
      transform: [
        {
          translateY: transformAnimation(),
        },
        {
          scale: isActive.value
            ? withTiming(1, { duration: HOLD_ITEM_TRANSFORM_DURATION })
            : itemScale.value,
        },
      ],
    };
  });
  const portalContainerStyle = useMemo(
    () => [styles.holdItem, animatedPortalStyle],
    [animatedPortalStyle]
  );

  const animatedPortalProps = useAnimatedProps<ViewProps>(() => ({
    pointerEvents: isActive.value ? "auto" : "none",
  }));
  //#endregion

  //#region animated effects
  useAnimatedReaction(
    () => state.value,
    (_state) => {
      if (_state === CONTEXT_MENU_STATE.END) {
        isActive.value = false;
      }
    }
  );
  //#endregion

  //#region components
  const GestureHandler = useMemo(() => {
    switch (activateOn) {
      case `double-tap`:
        return ({ children: handlerChildren }: GestureHandlerProps) => (
          <TapGestureHandler
            numberOfTaps={2}
            onHandlerStateChange={gestureEvent}
          >
            {handlerChildren}
          </TapGestureHandler>
        );
      case `tap`:
        return ({ children: handlerChildren }: GestureHandlerProps) => (
          <TapGestureHandler
            numberOfTaps={1}
            onHandlerStateChange={gestureEvent}
          >
            {handlerChildren}
          </TapGestureHandler>
        );
      // default is hold
      default:
        return ({ children: handlerChildren }: GestureHandlerProps) => (
          <LongPressGestureHandler
            minDurationMs={longPressMinDurationMs}
            onHandlerStateChange={gestureEvent}
          >
            {handlerChildren}
          </LongPressGestureHandler>
        );
    }
  }, [activateOn, gestureEvent, longPressMinDurationMs]);

  const PortalOverlay = useMemo(() => {
    return () => (
      <TapGestureHandler
        numberOfTaps={1}
        onHandlerStateChange={overlayGestureEvent}
      >
        <Animated.View style={styles.portalOverlay} />
      </TapGestureHandler>
    );
  }, [overlayGestureEvent]);

  return (
    <>
      <GestureHandler>
        <Animated.View ref={containerRef} style={containerStyle}>
          {children}
        </Animated.View>
      </GestureHandler>

      <Portal key={key}>
        <Animated.View
          key={key}
          style={portalContainerStyle}
          animatedProps={animatedPortalProps}
        >
          <PortalOverlay />
          {children}
        </Animated.View>
      </Portal>
    </>
  );
};

const HoldItem = memo(HoldItemComponent);

const styles = StyleSheet.create({
  holdItem: { zIndex: 10, position: "absolute" },
  portalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
});

export default HoldItem;
