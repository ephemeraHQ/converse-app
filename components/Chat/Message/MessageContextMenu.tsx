import { AnimatedBlurView } from "@components/AnimatedBlurView";
import TableView, { TableViewItemType } from "@components/TableView/TableView";
import { backgroundColor } from "@styles/colors";
import { calculateMenuHeight } from "@utils/contextMenu/calculateMenuHeight";
import {
  AUXILIARY_VIEW_MIN_HEIGHT,
  BACKDROP_DARK_BACKGROUND_COLOR,
  BACKDROP_LIGHT_BACKGROUND_COLOR,
  HOLD_ITEM_TRANSFORM_DURATION,
  ITEM_WIDTH,
  SIDE_MARGIN,
  SPRING_CONFIGURATION,
} from "@utils/contextMenu/constants";
import { ConversationContext } from "@utils/conversation";
import React, { FC, memo, useEffect, useMemo } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Portal } from "react-native-paper";
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContext } from "use-context-selector";

const BackdropComponent: FC<{
  isActive: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  itemRectY: SharedValue<number>;
  itemRectX: SharedValue<number>;
  itemRectHeight: SharedValue<number>;
  itemRectWidth: SharedValue<number>;
  auxiliaryView?: React.ReactNode;
  items: TableViewItemType[];
  fromMe: boolean;
}> = ({
  isActive,
  onClose,
  children,
  itemRectY,
  itemRectX,
  itemRectHeight,
  itemRectWidth,
  auxiliaryView,
  items,
  fromMe,
}) => {
  /* Portal is eating the context so passing down context values
    If it causes too many rerenders we could just pass down a
    few needed context values but painful to maintain */
  const conversationContext = useContext(ConversationContext);
  const activeValue = useSharedValue(false);
  const opacityValue = useSharedValue(0);
  const intensityValue = useSharedValue(0);
  const { height, width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const styles = useStyles();
  useEffect(() => {
    activeValue.value = isActive;
    opacityValue.value = withTiming(isActive ? 1 : 0, {
      duration: HOLD_ITEM_TRANSFORM_DURATION,
    });
    intensityValue.value = withTiming(isActive ? 50 : 0, {
      duration: HOLD_ITEM_TRANSFORM_DURATION,
    });
  }, [activeValue, isActive, opacityValue, intensityValue]);
  const menuHeight = useMemo(() => {
    return calculateMenuHeight(items.length);
  }, [items]);

  const animatedContainerProps = useAnimatedProps(() => {
    return {
      intensity: intensityValue.value,
    };
  });
  const colorScheme = useColorScheme();

  const animatedInnerContainerStyle = useAnimatedStyle(() => {
    const backgroundColor =
      colorScheme === "dark"
        ? BACKDROP_DARK_BACKGROUND_COLOR
        : BACKDROP_LIGHT_BACKGROUND_COLOR;

    return { backgroundColor };
  }, []);

  const animatedAuxiliaryViewStyle = useAnimatedStyle(() => {
    const getTransformValue = () => {
      if (itemRectY.value > AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top) {
        const spacing = 16;
        const topTransform =
          itemRectY.value +
          itemRectHeight.value +
          menuHeight +
          spacing +
          (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0) +
          (safeAreaInsets?.bottom || 0);
        return topTransform > height ? height - topTransform : 0;
      } else {
        return (
          -1 *
          (itemRectY.value - AUXILIARY_VIEW_MIN_HEIGHT - safeAreaInsets.top)
        );
      }
    };
    const tY = getTransformValue();
    return {
      position: "absolute",
      bottom:
        height - Math.max(itemRectY.value - 10 + tY, AUXILIARY_VIEW_MIN_HEIGHT),
      height: Math.max(
        itemRectY.value - itemRectHeight.value - safeAreaInsets.top + tY,
        AUXILIARY_VIEW_MIN_HEIGHT
      ),
      width: width - 2 * SIDE_MARGIN,
      left: fromMe ? undefined : itemRectX.value,
      right: fromMe ? width - itemRectX.value - itemRectWidth.value : undefined,
      marginRight: fromMe ? 0 : SIDE_MARGIN,
      marginLeft: fromMe ? SIDE_MARGIN : 0,
    };
  });

  const animatedMenuStyle = useAnimatedStyle(() => {
    const getTransformValue = () => {
      if (itemRectY.value > AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top) {
        const spacing = 10;
        const topTransform =
          itemRectY.value +
          itemRectHeight.value +
          menuHeight +
          spacing +
          (safeAreaInsets?.bottom || 0);
        const ty = topTransform > height ? height - topTransform : 0;
        return ty;
      } else {
        return (
          -1 *
          (itemRectY.value - AUXILIARY_VIEW_MIN_HEIGHT - safeAreaInsets.top - 5)
        );
      }
    };

    const tY = getTransformValue();
    const transformAnimation = () =>
      isActive
        ? withSpring(tY, SPRING_CONFIGURATION)
        : withTiming(0, { duration: HOLD_ITEM_TRANSFORM_DURATION });
    return {
      position: "absolute",
      top: itemRectY.value + itemRectHeight.value,
      left: fromMe ? undefined : itemRectX.value,
      right: fromMe ? width - itemRectX.value - itemRectWidth.value : undefined,
      width: ITEM_WIDTH,
      transform: [
        {
          translateY: transformAnimation(),
        },
      ],
    };
  });

  const animatedPortalStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(0, { duration: 0 }));
    const getTransformValue = () => {
      if (itemRectY.value > AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top) {
        const spacing = 15;
        const topTransform =
          itemRectY.value +
          itemRectHeight.value +
          menuHeight +
          spacing +
          (safeAreaInsets?.bottom || 0);
        const ty = topTransform > height ? height - topTransform : 0;
        return ty;
      } else {
        return (
          -1 *
          (itemRectY.value - AUXILIARY_VIEW_MIN_HEIGHT - safeAreaInsets.top)
        );
      }
    };

    const tY = getTransformValue();
    const transformAnimation = () =>
      isActive
        ? withSpring(tY, SPRING_CONFIGURATION)
        : withTiming(-0.1, { duration: HOLD_ITEM_TRANSFORM_DURATION });
    return {
      position: "absolute",
      top: itemRectY.value,
      left: itemRectX.value,
      height: itemRectHeight.value,
      width: itemRectWidth.value,
      opacity: isActive ? 1 : animateOpacity(),
      transform: [
        {
          translateY: transformAnimation(),
        },
        {
          scale: 1.05,
        },
      ],
    };
  });

  if (!isActive) {
    return null;
  }

  return (
    <Portal>
      {/* Portal is eating the context so passing down context values */}
      <ConversationContext.Provider value={conversationContext}>
        <GestureHandlerRootView style={styles.gestureHandlerContainer}>
          <AnimatedBlurView
            tint="default"
            style={styles.flex}
            animatedProps={animatedContainerProps}
          >
            <TouchableWithoutFeedback onPress={onClose}>
              <Animated.View
                style={[StyleSheet.absoluteFill, animatedInnerContainerStyle]}
              >
                <Animated.View style={animatedPortalStyle}>
                  {children}
                </Animated.View>
                <Animated.View style={animatedAuxiliaryViewStyle}>
                  {auxiliaryView}
                </Animated.View>
                <Animated.View style={animatedMenuStyle}>
                  <TableView style={styles.table} items={items} />
                </Animated.View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </AnimatedBlurView>
        </GestureHandlerRootView>
      </ConversationContext.Provider>
    </Portal>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
      borderWidth: 1,
      borderColor: "red",
    },
    gestureHandlerContainer: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    table: {
      width: ITEM_WIDTH,
      backgroundColor:
        Platform.OS === "android" ? backgroundColor(colorScheme) : undefined,
      borderRadius: Platform.OS === "android" ? 10 : undefined,
    },
  });
};

export const MessageContextMenu = memo(BackdropComponent);
