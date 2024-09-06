import { contextMenuStyleGuide } from "./contstants";
import { menuItemHeight } from "./menuItemHeight";

export const calculateMenuHeight = (
  itemLength: number,
  separatorCount: number
) => {
  "worklet";
  return (
    menuItemHeight() * itemLength +
    (itemLength - 1) +
    separatorCount * contextMenuStyleGuide.spacing
  );
};
