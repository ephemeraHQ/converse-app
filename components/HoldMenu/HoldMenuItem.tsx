import {
  BORDER_DARK_COLOR,
  BORDER_LIGHT_COLOR,
  CONTEXT_MENU_STATE,
  contextMenuStyleGuide,
} from "@utils/contextMenu/contstants";
import { getColor } from "@utils/contextMenu/getColor";
import { MenuItemProps } from "@utils/contextMenu/types";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useInternal } from "./useInternal";

// @ts-ignore
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type MenuItemComponentProps = {
  item: MenuItemProps;
  isLast?: boolean;
};

const MenuItemComponent = ({ item, isLast }: MenuItemComponentProps) => {
  const { state, theme, menuProps } = useInternal();

  const borderStyles = useAnimatedStyle(() => {
    const borderBottomColor =
      theme.value === "dark" ? BORDER_DARK_COLOR : BORDER_LIGHT_COLOR;

    return {
      borderBottomColor,
      borderBottomWidth: isLast ? 0 : 1,
    };
  }, [theme, isLast, item]);

  const textColor = useAnimatedStyle(() => {
    return { color: getColor(item.isTitle, item.isDestructive, theme.value) };
  }, [theme, item]);

  const handleOnPress = useCallback(() => {
    if (!item.isTitle) {
      const params = menuProps.value.actionParams[item.text] || [];
      if (item.onPress) item.onPress(...params);
      state.value = CONTEXT_MENU_STATE.END;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, item]);

  return (
    <>
      <AnimatedTouchable
        onPress={handleOnPress}
        activeOpacity={!item.isTitle ? 0.4 : 1}
        style={[styles.menuItem, borderStyles]}
      >
        <Animated.Text
          style={[
            item.isTitle ? styles.menuItemTitleText : styles.menuItemText,
            textColor,
          ]}
        >
          {item.text}
        </Animated.Text>
      </AnimatedTouchable>
      {/* {item.withSeparator && <Separator />} */}
    </>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: contextMenuStyleGuide.spacing * 2,
    paddingVertical: contextMenuStyleGuide.spacing * 1.25,
  },
  menuItemTitleText: {
    fontSize: contextMenuStyleGuide.typography.callout2.fontSize,
    lineHeight: contextMenuStyleGuide.typography.callout2.lineHeight,
    textAlign: "center",
    width: "100%",
    flex: 1,
  },
  menuItemText: {
    fontSize: contextMenuStyleGuide.typography.callout.fontSize,
    lineHeight: contextMenuStyleGuide.typography.callout.lineHeight,
    textAlign: "left",
    width: "100%",
    flex: 1,
  },
});

export const HoldMenuItem = React.memo(MenuItemComponent);
