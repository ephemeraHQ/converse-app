import { MESSAGE_GESTURE_LONG_PRESS_SCALE } from "@/components/Chat/Message/message-gestures";
import TableView, { TableViewItemType } from "@components/TableView/TableView";
import { BlurView } from "@design-system/BlurView";
import {
  AUXILIARY_VIEW_GAP,
  MENU_GAP,
} from "@design-system/ContextMenu/ContextMenu.constants";
import { calculateMenuHeight } from "@design-system/ContextMenu/ContextMenu.utils";
import { animation } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import React, { useEffect, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Portal } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AUXILIARY_VIEW_MIN_HEIGHT = 210;

export type IMessageContextMenuProps = {
  Content: React.ReactNode;
  itemRectY: number;
  itemRectX: number;
  itemRectHeight: number;
  itemRectWidth: number;
  items: TableViewItemType[];
  fromMe: boolean;
  onClose?: () => void;
  auxiliaryView?: React.ReactNode;
};

export const MessageContextMenu = ({
  onClose,
  Content,
  itemRectY,
  itemRectX,
  itemRectHeight,
  itemRectWidth,
  auxiliaryView,
  items,
  fromMe,
}: IMessageContextMenuProps) => {
  const { theme } = useAppTheme();
  const { height, width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  const auxiliaryViewHeight = useMemo(() => {
    return auxiliaryView ? AUXILIARY_VIEW_MIN_HEIGHT : 0;
  }, [auxiliaryView]);

  const menuHeight = useMemo(() => {
    return calculateMenuHeight(items.length);
  }, [items]);

  const auxiliaryViewTranslateY = useSharedValue(0);
  const menuTranslateY = useSharedValue(0);
  const portalTranslateY = useSharedValue(0);

  console.log("items:", items);

  useEffect(() => {
    // Calculate the vertical position of the menu (same as message)
    const topTransform =
      itemRectY +
      itemRectHeight +
      menuHeight +
      theme.spacing.xs +
      (safeAreaInsets?.bottom || 0);

    // Short message near the top of the screen, requires downward adjustment
    const baseTransform =
      -1 *
      (itemRectY - theme.spacing.xs - auxiliaryViewHeight - safeAreaInsets.top);

    const calculateAuxiliaryViewTransform = () => {
      // Adjust positioning when message height exceeds half the screen
      if (itemRectHeight > height / 2) {
        // Calculate offset based on whether reactions are present
        const offset =
          itemRectHeight > auxiliaryViewHeight
            ? auxiliaryViewHeight
            : safeAreaInsets.top;
        return -itemRectY + offset;
      }

      // General case for shorter messages
      if (itemRectY > auxiliaryViewHeight + safeAreaInsets.top) {
        return topTransform > height
          ? height - topTransform - AUXILIARY_VIEW_GAP
          : -AUXILIARY_VIEW_GAP;
      }

      return baseTransform + theme.spacing.xs - AUXILIARY_VIEW_GAP;
    };

    const calculateMenuTransform = () => {
      // Use same logic as message positioning
      if (itemRectHeight > height / 2) {
        return height - topTransform - safeAreaInsets.bottom;
      }

      // General case for shorter messages
      if (itemRectY > auxiliaryViewHeight + safeAreaInsets.top) {
        return topTransform > height ? height - topTransform : 0;
      }

      return baseTransform;
    };

    const calculatePortalTransform = () => {
      // Adjust positioning when message height exceeds half the screen
      if (itemRectHeight > height / 2) {
        return height - topTransform;
      }

      // General case for shorter messages
      if (itemRectY > auxiliaryViewHeight + safeAreaInsets.top) {
        return topTransform > height ? height - topTransform : 0;
      }

      return baseTransform;
    };

    auxiliaryViewTranslateY.value = withSpring(
      calculateAuxiliaryViewTransform(),
      animation.contextMenuSpring
    );

    menuTranslateY.value = withSpring(
      calculateMenuTransform(),
      animation.contextMenuSpring
    );

    portalTranslateY.value = withSpring(
      calculatePortalTransform(),
      animation.contextMenuSpring
    );
  }, [
    itemRectY,
    itemRectHeight,
    menuHeight,
    height,
    safeAreaInsets,
    theme.spacing.xs,
    auxiliaryViewHeight,
    auxiliaryViewTranslateY,
    menuTranslateY,
    portalTranslateY,
  ]);

  // Attribution Panel + Emoji Picker
  const animatedAuxiliaryViewStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: itemRectY,
      left: fromMe ? undefined : itemRectX,
      right: fromMe ? width - itemRectX - itemRectWidth : undefined,
      transform: [{ translateY: auxiliaryViewTranslateY.value }],
    };
  });

  // Context menu
  const animatedMenuStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: itemRectY + itemRectHeight + MENU_GAP,
      left: fromMe ? undefined : itemRectX,
      right: fromMe ? width - itemRectX - itemRectWidth : undefined,
      width: 180,
      transform: [{ translateY: menuTranslateY.value }],
    };
  });

  // Message
  const animatedPortalStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: itemRectY,
      left: itemRectX,
      height: itemRectHeight,
      width: itemRectWidth,
      opacity: 1,
      transform: [
        { translateY: portalTranslateY.value },
        // { scale: MESSAGE_GESTURE_LONG_PRESS_SCALE },
      ],
    };
  });

  return (
    <Portal>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BlurView isAbsolute>
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View style={StyleSheet.absoluteFill}>
              <Animated.View
                style={[
                  { transform: [{ translateY: 0 }] },
                  animatedPortalStyle,
                ]}
              >
                {Content}
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
    </Portal>
  );
};
