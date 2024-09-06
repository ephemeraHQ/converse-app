import {
  MENU_TITLE_COLOR,
  MENU_TEXT_DESTRUCTIVE_COLOR_DARK,
  MENU_TEXT_DESTRUCTIVE_COLOR_LIGHT,
  MENU_TEXT_DARK_COLOR,
  MENU_TEXT_LIGHT_COLOR,
} from "./contstants";

export const getColor = (
  isTitle: boolean | undefined,
  isDestructive: boolean | undefined,
  themeValue: "light" | "dark"
) => {
  "worklet";
  return isTitle
    ? MENU_TITLE_COLOR
    : isDestructive
    ? themeValue === "dark"
      ? MENU_TEXT_DESTRUCTIVE_COLOR_DARK
      : MENU_TEXT_DESTRUCTIVE_COLOR_LIGHT
    : themeValue === "dark"
    ? MENU_TEXT_DARK_COLOR
    : MENU_TEXT_LIGHT_COLOR;
};
