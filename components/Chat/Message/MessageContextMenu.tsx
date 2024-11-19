import TableView, { TableViewItemType } from "@components/TableView/TableView";
import { BlurView } from "@design-system/BlurView";
import { useAppTheme } from "@theme/useAppTheme";
import { animations } from "@theme/animations";
import {
  MENU_GAP,
  AUXILIARY_VIEW_GAP,
} from "@design-system/ContextMenu/ContextMenu.constants";
import { calculateMenuHeight } from "@design-system/ContextMenu/ContextMenu.utils";
import { ConversationContext } from "@utils/conversation";
import React, { FC, memo, useEffect, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Portal } from "react-native-paper";
import Animated, {
  SharedValue,
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
  const { theme } = useAppTheme();
  const conversationContext = useContext(ConversationContext);
  const activeValue = useSharedValue(false);
  const opacityValue = useSharedValue(0);
  const intensityValue = useSharedValue(0);
  const { height, width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  const AUXILIARY_VIEW_MIN_HEIGHT = 210;

  useEffect(() => {
    activeValue.value = isActive;
    opacityValue.value = withTiming(isActive ? 1 : 0, {
      duration: animations.contextMenuHoldDuration,
    });
    intensityValue.value = withTiming(isActive ? 50 : 0, {
      duration: animations.contextMenuHoldDuration,
    });
  }, [activeValue, isActive, opacityValue, intensityValue]);

  const menuHeight = useMemo(() => {
    return calculateMenuHeight(items.length);
  }, [items]);

  // Attribution Panel + Emoji Picker

  const animatedAuxiliaryViewStyle = useAnimatedStyle(() => {
    const getTransformValue = () => {
      const topTransform =
        // Y position of the message
        itemRectY.value +
        // Height of the message
        itemRectHeight.value +
        // Height of the context menu
        menuHeight +
        // Space between the message and the context menu
        theme.spacing.xs +
        // Account for safe area at the bottom of the screen
        (safeAreaInsets?.bottom || 0);

      // Adjust positioning when message height exceeds half the screen
      if (itemRectHeight.value > height / 2) {
        // Calculate offset based on whether reactions are present
        const offset =
          itemRectHeight.value > AUXILIARY_VIEW_MIN_HEIGHT
            ? AUXILIARY_VIEW_MIN_HEIGHT
            : safeAreaInsets.top;
        return -itemRectY.value + offset;
      } else if (
        itemRectY.value >
        AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top
      ) {
        // General case for shorter messages
        return topTransform > height
          ? height - topTransform - AUXILIARY_VIEW_GAP
          : -AUXILIARY_VIEW_GAP;
      } else {
        // Short message near the top of the screen, requires downward adjustment
        return (
          -1 *
          (itemRectY.value -
            AUXILIARY_VIEW_MIN_HEIGHT -
            safeAreaInsets.top +
            AUXILIARY_VIEW_GAP -
            theme.spacing.xs)
        );
      }
    };

    const tY = getTransformValue();
    const transformAnimation = () =>
      isActive
        ? withSpring(tY, animations.contextMenuSpring)
        : withTiming(0, { duration: animations.contextMenuHoldDuration });
    return {
      position: "absolute",
      top: itemRectY.value,
      left: fromMe ? undefined : itemRectX.value,
      right: fromMe ? width - itemRectX.value - itemRectWidth.value : undefined,
      transform: [
        {
          translateY: transformAnimation(),
        },
      ],
    };
  });

  // Context menu

  const animatedMenuStyle = useAnimatedStyle(() => {
    const getTransformValue = () => {
      // Calculate the vertical position of the menu (same as message)
      const topTransform =
        // Y position of the message
        itemRectY.value +
        // Height of the message
        itemRectHeight.value +
        // Height of the context menu
        menuHeight +
        // Add spacing between menu and message
        theme.spacing.xs +
        // Account for bottom safe area (messages aligned from bottom)
        (safeAreaInsets?.bottom || 0);

      // Use same logic as message positioning
      if (itemRectHeight.value > height / 2) {
        return height - topTransform - safeAreaInsets.bottom;
      } else if (
        itemRectY.value >
        AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top
      ) {
        // General case for shorter messages
        return topTransform > height ? height - topTransform : 0;
      } else {
        // Short message near the top of the screen
        return (
          -1 *
          (itemRectY.value -
            theme.spacing.xs -
            AUXILIARY_VIEW_MIN_HEIGHT -
            safeAreaInsets.top)
        );
      }
    };

    const tY = getTransformValue();
    const transformAnimation = () =>
      isActive
        ? withSpring(tY, animations.contextMenuSpring)
        : withTiming(0, { duration: animations.contextMenuHoldDuration });

    return {
      position: "absolute",
      top: itemRectY.value + itemRectHeight.value + MENU_GAP,
      left: fromMe ? undefined : itemRectX.value,
      right: fromMe ? width - itemRectX.value - itemRectWidth.value : undefined,
      width: 180,
      transform: [
        {
          translateY: transformAnimation(),
        },
      ],
    };
  });

  // Message

  const animatedPortalStyle = useAnimatedStyle(() => {
    const animateOpacity = () =>
      withDelay(
        animations.contextMenuHoldDuration,
        withTiming(0, { duration: 0 })
      );
    const getTransformValue = () => {
      // Calculate the vertical position of the message bubble
      const topTransform =
        // Y position of the message
        itemRectY.value +
        // Height of the message
        itemRectHeight.value +
        // Height of the context menu
        menuHeight +
        // Add spacing between menu and message
        theme.spacing.xs +
        // Account for bottom safe area (messages aligned from bottom)
        (safeAreaInsets?.bottom || 0);

      // Adjust positioning when message height exceeds half the screen
      if (itemRectHeight.value > height / 2) {
        return height - topTransform;
      } else if (
        itemRectY.value >
        AUXILIARY_VIEW_MIN_HEIGHT + safeAreaInsets.top
      ) {
        // General case for shorter messages
        return topTransform > height ? height - topTransform : 0;
      } else {
        // Short message near the top of the screen, requires downward adjustment
        return (
          -1 *
          (itemRectY.value -
            theme.spacing.xs -
            AUXILIARY_VIEW_MIN_HEIGHT -
            safeAreaInsets.top)
        );
      }
    };

    const tY = getTransformValue();
    const transformAnimation = () =>
      isActive
        ? withSpring(tY, animations.contextMenuSpring)
        : withTiming(-0.1, { duration: animations.contextMenuHoldDuration });
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
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BlurView isAbsolute>
            <TouchableWithoutFeedback onPress={onClose}>
              <Animated.View style={StyleSheet.absoluteFill}>
                <Animated.View style={animatedPortalStyle}>
                  {children}
                </Animated.View>
                <Animated.View style={animatedAuxiliaryViewStyle}>
                  {auxiliaryView}
                </Animated.View>
                <Animated.View style={animatedMenuStyle}>
                  <TableView
                    items={items}
                    style={{
                      width: 180,
                      backgroundColor:
                        Platform.OS === "android"
                          ? theme.colors.background.raised
                          : undefined,
                      borderRadius: Platform.OS === "android" ? 10 : undefined,
                    }}
                  />
                </Animated.View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </GestureHandlerRootView>
      </ConversationContext.Provider>
    </Portal>
  );
};

export const MessageContextMenu = memo(BackdropComponent);
