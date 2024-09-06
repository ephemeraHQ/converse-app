import { contextMenuStyleGuide, FONT_SCALE } from "./contstants";

export const menuItemHeight = () => {
  "worklet";
  return (
    contextMenuStyleGuide.typography.callout.lineHeight * FONT_SCALE +
    contextMenuStyleGuide.spacing * 2.5
  );
};
