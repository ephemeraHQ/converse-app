import { SharedValue } from "react-native-reanimated";

import { MENU_WIDTH } from "./contstants";
import { MenuInternalProps } from "./types";

export const leftOrRight = (menuProps: SharedValue<MenuInternalProps>) => {
  "worklet";

  const anchorPositionHorizontal = menuProps.value.anchorPosition.split("-")[1];
  const itemWidth = menuProps.value.itemWidth;

  let leftPosition = 0;
  anchorPositionHorizontal === "right"
    ? (leftPosition = -MENU_WIDTH + itemWidth)
    : anchorPositionHorizontal === "left"
    ? (leftPosition = 0)
    : (leftPosition =
        -menuProps.value.itemWidth -
        MENU_WIDTH / 2 +
        menuProps.value.itemWidth / 2);

  return leftPosition;
};
