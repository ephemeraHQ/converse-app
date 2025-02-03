import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { AnimatedVStack } from "@/design-system/VStack";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { memo, useCallback } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { IContextMenuViewProps } from "./context-menu.types";

export const ContextMenuView = memo(function ContextMenuView(
  props: IContextMenuViewProps
) {
  // Not sure which one has best UX
  // I think ActionSheet is better since not sure dropdown has support JUST for long press.
  // We could probably make it happen in some way but not priority for now IMO
  return <ContextMenuActionSheet {...props} />;
  // return <ContextMenuDropdown {...props} />;
});

export const ContextMenuDropdown = memo(function ContextMenuDropdown(
  props: IContextMenuViewProps
) {
  const { menuConfig, onPressMenuItem, children, style } = props;

  // Transform menuConfig.menuItems into DropdownMenu actions format
  const actions = menuConfig.menuItems.map((item) => ({
    id: item.actionKey,
    title: item.actionTitle,
    // Map system icon
    systemIcon: item.icon.iconValue,
    // Map destructive attribute to red color
    color: item.menuAttributes?.includes("destructive")
      ? "red"
      : item.icon.iconTint,
  }));

  const handlePress = (actionId: string) => {
    onPressMenuItem?.({
      nativeEvent: { actionKey: actionId },
    });
  };

  return (
    <DropdownMenu
      shouldOpenOnLongPress={true}
      actions={actions}
      style={style}
      onPress={handlePress}
    >
      {children}
    </DropdownMenu>
  );
});

const ContextMenuActionSheet = memo(function ContextMenuActionSheet(
  props: IContextMenuViewProps
) {
  const { theme } = useAppTheme();

  const {
    hitSlop = theme.spacing.xs,
    onMenuWillHide,
    onMenuWillShow,
    onPressMenuPreview, // Preview not handled in Android for now
    previewConfig, // Preview not handled in Android for now
    renderPreview, // Preview not handled in Android for now
    shouldWaitForMenuToHideBeforeFiringOnPressMenuItem, // Preview not handled in Android for now
    menuConfig,
    onPressMenuItem,
    children,
    style,
  } = props;

  const scaleAV = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAV.value }],
  }));

  const showActionSheet = useCallback(() => {
    // Transform menuConfig.menuItems into action sheet options
    const options = [
      ...menuConfig.menuItems.map((item) => item.actionTitle),
      "Cancel",
    ];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = menuConfig.menuItems.findIndex((item) =>
      item.menuAttributes?.includes("destructive")
    );

    if (onMenuWillShow) {
      onMenuWillShow();
    }

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex:
          destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
      },
      (selectedIndex) => {
        if (onMenuWillHide) {
          onMenuWillHide();
        }

        if (
          selectedIndex !== undefined &&
          selectedIndex !== cancelButtonIndex
        ) {
          onPressMenuItem?.({
            nativeEvent: {
              actionKey: menuConfig.menuItems[selectedIndex].actionKey,
            },
          });
        }
      }
    );
  }, [menuConfig, onPressMenuItem, onMenuWillHide, onMenuWillShow]);

  // Maybe gesture can be improved. Didn't want to spend too much time on it since we might find a better solution for Android later.
  const longPressGesture = Gesture.LongPress()
    .onBegin(() => {
      scaleAV.value = withSequence(
        withTiming(0.95, {
          duration: 500,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Slow ease-out
        }),
        withTiming(1.02, {
          duration: 300,
          easing: Easing.bezier(0.33, 0, 0.67, 1), // Quick ease
        }),
        withTiming(1, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
    })
    .onStart((e) => {
      Haptics.softImpactAsyncAnimated();
      runOnJS(showActionSheet)();
    })
    .onFinalize(() => {
      // Reset
      scaleAV.value = withTiming(1, {
        duration: 100,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    })
    .minDuration(500)
    .hitSlop(hitSlop);

  return (
    <GestureDetector gesture={longPressGesture}>
      <AnimatedVStack style={[style, animatedStyle]}>{children}</AnimatedVStack>
    </GestureDetector>
  );
});
