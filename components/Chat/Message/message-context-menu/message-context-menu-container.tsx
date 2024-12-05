import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE } from "./message-context-menu";
import {
  MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT,
  MESSAGE_CONTEXT_REACTIONS_HEIGHT,
} from "./message-context-menu-constant";

export const MessageContextMenuContainer = memo(
  function MessageContextMenuContainer(args: {
    children: React.ReactNode;
    itemRectY: number;
    itemRectX: number;
    itemRectHeight: number;
    itemRectWidth: number;
    menuHeight: number;
    fromMe: boolean;
    hasReactions: boolean;
  }) {
    const { theme } = useAppTheme();
    const safeAreaInsets = useSafeAreaInsets();
    const translateYAV = useSharedValue(0);

    const {
      itemRectY,
      itemRectX,
      itemRectHeight,
      itemRectWidth,
      menuHeight,
      fromMe,
      hasReactions,
      children,
    } = args;

    useEffect(() => {
      const screenHeight = theme.layout.screen.height;
      const minTopOffset =
        MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT +
        MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE +
        safeAreaInsets.top +
        (hasReactions
          ? MESSAGE_CONTEXT_REACTIONS_HEIGHT +
            // Small buffer to give space to reactors
            theme.spacing.xxl
          : 0);
      const containerBottom =
        itemRectY +
        itemRectHeight +
        MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE +
        menuHeight +
        safeAreaInsets.bottom;

      let translateY = 0;

      if (containerBottom > screenHeight) {
        // Not enough space at the bottom
        translateY = screenHeight - containerBottom;
      } else if (itemRectY < minTopOffset) {
        // Not enough space at the top
        translateY = minTopOffset - itemRectY;
      } else {
        translateY = 0; // Default position
      }

      translateYAV.value = withSpring(
        translateY,
        theme.animation.contextMenuSpring
      );
    }, [
      hasReactions,
      itemRectY,
      itemRectHeight,
      menuHeight,
      safeAreaInsets,
      theme,
      translateYAV,
    ]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateYAV.value }],
    }));

    const distanceFromTop =
      itemRectY -
      MESSAGE_CONTEXT_MENU_ABOVE_MESSAGE_REACTIONS_HEIGHT -
      MESSAGE_CONTEXT_MENU_SPACE_BETWEEN_ABOVE_MESSAGE_REACTIONS_AND_MESSAGE;

    return (
      <AnimatedVStack
        // {...debugBorder("red")}
        style={[
          {
            position: "absolute",
            top: distanceFromTop,
            left: 0,
            right: 0,
          },
          animatedStyle,
        ]}
      >
        <VStack
          // {...debugBorder()}
          style={{
            alignItems: fromMe ? "flex-end" : "flex-start",
            ...(fromMe
              ? { right: theme.layout.screen.width - itemRectX - itemRectWidth }
              : {
                  left: itemRectX,
                }),
          }}
        >
          {children}
        </VStack>
      </AnimatedVStack>
    );
  }
);
