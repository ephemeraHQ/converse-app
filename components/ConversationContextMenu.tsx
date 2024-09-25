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
import { BlurView } from "expo-blur";
import React, { FC, memo, useEffect, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
  View,
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

const AnimatedBlurView =
  Platform.OS === "ios"
    ? Animated.createAnimatedComponent(BlurView)
    : Animated.createAnimatedComponent(View);

type ConversationContextMenuProps = {
  isVisible: boolean;
  onClose: () => void;
  items: TableViewItemType[];
  itemRect: SharedValue<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  conversation: {
    name: string;
    lastMessagePreview?: string;
  };
  fromMe?: boolean;
  children?: React.ReactNode;
};

const ConversationContextMenuComponent: FC<ConversationContextMenuProps> = ({
  isVisible,
  onClose,
  items,
  itemRect,
  conversation,
  fromMe = false,
  children,
}) => {
  const conversationContext = useContext(ConversationContext);
  const activeValue = useSharedValue(false);
  const opacityValue = useSharedValue(0);
  const intensityValue = useSharedValue(0);
  const { height, width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  useEffect(() => {
    activeValue.value = isVisible;
    opacityValue.value = withTiming(isVisible ? 1 : 0, {
      duration: HOLD_ITEM_TRANSFORM_DURATION,
    });
    intensityValue.value = withTiming(isVisible ? 50 : 0, {
      duration: HOLD_ITEM_TRANSFORM_DURATION,
    });
  }, [activeValue, isVisible, opacityValue, intensityValue]);

  const menuHeight = useMemo(() => {
    return calculateMenuHeight(items.length);
  }, [items]);

  const animatedContainerProps = useAnimatedProps(() => ({
    intensity: intensityValue.value,
  }));

  const animatedInnerContainerStyle = useAnimatedStyle(() => ({
    backgroundColor:
      colorScheme === "dark"
        ? BACKDROP_DARK_BACKGROUND_COLOR
        : BACKDROP_LIGHT_BACKGROUND_COLOR,
  }));

  const animatedPreviewStyle = useAnimatedStyle(() => {
    const getTransformValue = () => {
      if (itemRect.value.y > AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top) {
        const spacing = 16;
        const topTransform =
          itemRect.value.y +
          itemRect.value.height +
          menuHeight +
          spacing +
          (safeAreaInsets?.bottom || 0);
        return topTransform > height ? height - topTransform : 0;
      } else {
        return (
          -1 *
          (itemRect.value.y - AUXILIARY_VIEW_MIN_HEIGHT - safeAreaInsets.top)
        );
      }
    };
    const tY = getTransformValue();
    return {
      position: "absolute",
      bottom:
        height -
        Math.max(itemRect.value.y - 10 + tY, AUXILIARY_VIEW_MIN_HEIGHT),
      height: Math.max(
        itemRect.value.y - itemRect.value.height - safeAreaInsets.top + tY,
        AUXILIARY_VIEW_MIN_HEIGHT
      ),
      width: width - 2 * SIDE_MARGIN,
      left: fromMe ? undefined : itemRect.value.x,
      right: fromMe
        ? width - itemRect.value.x - itemRect.value.width
        : undefined,
      marginRight: fromMe ? 0 : SIDE_MARGIN,
      marginLeft: fromMe ? SIDE_MARGIN : 0,
    };
  });

  const animatedMenuStyle = useAnimatedStyle(() => {
    const getTransformValue = () => {
      if (itemRect.value.y > AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top) {
        const spacing = 10;
        const topTransform =
          itemRect.value.y +
          itemRect.value.height +
          menuHeight +
          spacing +
          (safeAreaInsets?.bottom || 0);
        const ty = topTransform > height ? height - topTransform : 0;
        return ty;
      } else {
        return (
          -1 *
          (itemRect.value.y -
            AUXILIARY_VIEW_MIN_HEIGHT -
            safeAreaInsets.top -
            5)
        );
      }
    };

    const tY = getTransformValue();
    const transformAnimation = () =>
      isVisible
        ? withSpring(tY, SPRING_CONFIGURATION)
        : withTiming(0, { duration: HOLD_ITEM_TRANSFORM_DURATION });
    return {
      position: "absolute",
      top: itemRect.value.y + itemRect.value.height,
      left: fromMe ? undefined : itemRect.value.x,
      right: fromMe
        ? width - itemRect.value.x - itemRect.value.width
        : undefined,
      width: ITEM_WIDTH,
      transform: [
        {
          translateY: transformAnimation(),
        },
      ],
    };
  });

  const animatedConversationStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(HOLD_ITEM_TRANSFORM_DURATION, withTiming(0, { duration: 0 }));
    const getTransformValue = () => {
      if (itemRect.value.y > AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top) {
        const spacing = 15;
        const topTransform =
          itemRect.value.y +
          itemRect.value.height +
          menuHeight +
          spacing +
          (safeAreaInsets?.bottom || 0);
        const ty = topTransform > height ? height - topTransform : 0;
        return ty;
      } else {
        return (
          -1 *
          (itemRect.value.y - AUXILIARY_VIEW_MIN_HEIGHT - safeAreaInsets.top)
        );
      }
    };

    const tY = getTransformValue();
    const transformAnimation = () =>
      isVisible
        ? withSpring(tY, SPRING_CONFIGURATION)
        : withTiming(-0.1, { duration: HOLD_ITEM_TRANSFORM_DURATION });
    return {
      position: "absolute",
      top: itemRect.value.y,
      left: itemRect.value.x,
      height: itemRect.value.height,
      width: itemRect.value.width,
      opacity: isVisible ? 1 : animateOpacity(),
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

  if (!isVisible) {
    return null;
  }

  return (
    <Portal>
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
                <Animated.View style={animatedConversationStyle}>
                  {children}
                </Animated.View>
                <Animated.View style={animatedPreviewStyle}>
                  {/* Add conversation preview here */}
                </Animated.View>
                <Animated.View style={animatedMenuStyle}>
                  <TableView
                    style={{
                      width: ITEM_WIDTH,
                      backgroundColor:
                        Platform.OS === "android"
                          ? backgroundColor(colorScheme)
                          : undefined,
                      borderRadius: Platform.OS === "android" ? 10 : undefined,
                    }}
                    items={items}
                  />
                </Animated.View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </AnimatedBlurView>
        </GestureHandlerRootView>
      </ConversationContext.Provider>
    </Portal>
  );
};

const styles = StyleSheet.create({
  gestureHandlerContainer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});

export const ConversationContextMenu = memo(ConversationContextMenuComponent);
