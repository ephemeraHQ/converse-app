import { calculateMenuHeight } from "@utils/contextMenu/calculateMenuHeight";
import {
  CONTEXT_MENU_STATE,
  contextMenuStyleGuide,
  HOLD_ITEM_TRANSFORM_DURATION,
  IS_IOS,
  MENU_WIDTH,
  SPRING_CONFIGURATION_MENU,
} from "@utils/contextMenu/contstants";
import { deepEqual } from "@utils/contextMenu/deepEqual";
import { leftOrRight } from "@utils/contextMenu/leftOrRight";
import { menuAnimationAnchor } from "@utils/contextMenu/menuAnimationAnchor";
import { MenuItemProps } from "@utils/contextMenu/types";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { HoldMenuItems } from "./HoldMenuItems";
import { useInternal } from "./useInternal";

const AnimatedView = Animated.createAnimatedComponent(BlurView);

const MenuListComponent = () => {
  const { state, theme, menuProps } = useInternal();

  const [itemList, setItemList] = React.useState<MenuItemProps[]>([]);

  const menuHeight = useDerivedValue(() => {
    const itemsWithSeparator = menuProps.value.items.filter(
      (item) => item.withSeparator
    );
    return calculateMenuHeight(
      menuProps.value.items.length,
      itemsWithSeparator.length
    );
  }, [menuProps]);
  const prevList = useSharedValue<MenuItemProps[]>([]);

  const messageStyles = useAnimatedStyle(() => {
    const itemsWithSeparator = menuProps.value.items.filter(
      (item) => item.withSeparator
    );

    const translate = menuAnimationAnchor(
      menuProps.value.anchorPosition,
      menuProps.value.itemWidth,
      menuProps.value.items.length,
      itemsWithSeparator.length
    );

    const _leftPosition = leftOrRight(menuProps);

    const menuScaleAnimation = () =>
      state.value === CONTEXT_MENU_STATE.ACTIVE
        ? withSpring(1, SPRING_CONFIGURATION_MENU)
        : withTiming(0, {
            duration: HOLD_ITEM_TRANSFORM_DURATION,
          });

    const opacityAnimation = () =>
      withTiming(state.value === CONTEXT_MENU_STATE.ACTIVE ? 1 : 0, {
        duration: HOLD_ITEM_TRANSFORM_DURATION,
      });

    return {
      left: _leftPosition,
      height: menuHeight.value,
      opacity: opacityAnimation(),
      transform: [
        { translateX: translate.beginningTransformations.translateX },
        { translateY: translate.beginningTransformations.translateY },
        {
          scale: menuScaleAnimation(),
        },
        { translateX: translate.endingTransformations.translateX },
        { translateY: translate.endingTransformations.translateY },
      ],
    };
  });

  const animatedInnerContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor:
        theme.value === "light"
          ? IS_IOS
            ? "rgba(255, 255, 255, .75)"
            : "rgba(255, 255, 255, .95)"
          : IS_IOS
          ? "rgba(0,0,0,0.5)"
          : "rgba(39, 39, 39, .8)",
    };
  }, [theme]);

  const animatedProps = useAnimatedProps(() => {
    return { tint: theme.value };
  }, [theme]);

  const setter = (items: MenuItemProps[]) => {
    setItemList(items);
    prevList.value = items;
  };

  useAnimatedReaction(
    () => menuProps.value.items,
    (_items) => {
      if (!deepEqual(_items, prevList.value)) {
        runOnJS(setter)(_items);
      }
    },
    [menuProps]
  );

  return (
    <AnimatedView
      intensity={100}
      animatedProps={animatedProps}
      style={[styles.menuContainer, messageStyles]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.menuInnerContainer,
          animatedInnerContainerStyle,
        ]}
      >
        <HoldMenuItems items={itemList} />
      </Animated.View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  menuWrapper: {
    position: "absolute",
    left: 0,
    zIndex: 10,
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    width: MENU_WIDTH,
    borderRadius: contextMenuStyleGuide.spacing * 1.5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    overflow: "hidden",
    zIndex: 15,
  },
  menuInnerContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  menuItem: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: contextMenuStyleGuide.spacing * 2,
    paddingVertical: contextMenuStyleGuide.spacing * 1.25,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  menuItemText: {
    fontSize: contextMenuStyleGuide.typography.callout.fontSize,
    lineHeight: contextMenuStyleGuide.typography.callout.lineHeight,
    textAlign: "left",
    width: "100%",
    flex: 1,
  },
  menuItemTitleText: {
    fontSize: contextMenuStyleGuide.typography.callout2.fontSize,
    lineHeight: contextMenuStyleGuide.typography.callout2.lineHeight,
    textAlign: "center",
    width: "100%",
    flex: 1,
  },
  textDark: {
    color: "black",
  },
  textLight: {
    color: "white",
  },
});

export const HoldMenuList = React.memo(MenuListComponent);
