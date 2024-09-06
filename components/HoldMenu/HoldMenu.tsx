import {
  CONTEXT_MENU_STATE,
  HOLD_ITEM_TRANSFORM_DURATION,
  SPRING_CONFIGURATION,
} from "@utils/contextMenu/contstants";
import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { HoldMenuList } from "./HoldMenuList";
import { useInternal } from "./useInternal";

const MenuComponent = () => {
  const { state, menuProps } = useInternal();

  const wrapperStyles = useAnimatedStyle(() => {
    const anchorPositionVertical = menuProps.value.anchorPosition.split("-")[0];

    const top =
      anchorPositionVertical === "top"
        ? menuProps.value.itemHeight + menuProps.value.itemY + 8
        : menuProps.value.itemY - 8;
    const left = menuProps.value.itemX;
    const width = menuProps.value.itemWidth;
    const tY = menuProps.value.transformValue;

    return {
      top,
      left,
      width,
      transform: [
        {
          translateY:
            state.value === CONTEXT_MENU_STATE.ACTIVE
              ? withSpring(tY, SPRING_CONFIGURATION)
              : withTiming(0, { duration: HOLD_ITEM_TRANSFORM_DURATION }),
        },
      ],
    };
  }, [menuProps]);

  return (
    <Animated.View style={[styles.menuWrapper, wrapperStyles]}>
      <HoldMenuList />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuWrapper: {
    position: "absolute",
    left: 0,
    zIndex: 10,
  },
});

export const HoldMenu = React.memo(MenuComponent);
