import { ColorSchemeName } from "react-native";

const BACKGROUND_LIGHT = "#FFF";
const BACKGROUND_DARK = "#111";

export const backgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return BACKGROUND_DARK;
  return BACKGROUND_LIGHT;
};

const NAVIGATION_SECONDARY_BACKGROUND_LIGHT = "#F9F9F9";
const NAVIGATION_SECONDARY_BACKGROUND_DARK = "#1C1C1E";

export const navigationSecondaryBackgroundColor = (
  colorScheme: ColorSchemeName
) => {
  if (colorScheme === "dark") return NAVIGATION_SECONDARY_BACKGROUND_DARK;
  return NAVIGATION_SECONDARY_BACKGROUND_LIGHT;
};

const TEXT_PRIMARY_COLOR_LIGHT = "#000";
const TEXT_PRIMARY_COLOR_DARK = "#FFF";

export const textPrimaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return TEXT_PRIMARY_COLOR_DARK;
  return TEXT_PRIMARY_COLOR_LIGHT;
};

const TEXT_SECONDARY_COLOR_LIGHT = "rgba(60, 60, 67, 0.6)";
const TEXT_SECONDARY_COLOR_DARK = "rgba(235, 235, 245, 0.6)";

export const textSecondaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return TEXT_SECONDARY_COLOR_DARK;
  return TEXT_SECONDARY_COLOR_LIGHT;
};

const ACTION_SECONDARY_COLOR_LIGHT = "rgba(60, 60, 67, 0.3)";
const ACTION_SECONDARY_COLOR_DARK = "rgba(235, 235, 245, 0.3)";

export const actionSecondaryColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return ACTION_SECONDARY_COLOR_DARK;
  return ACTION_SECONDARY_COLOR_LIGHT;
};

const CLICKED_ITEM_BACKGROUND_LIGHT = "#D1D1D5";
const CLICKED_ITEM_BACKGROUND_DARK = "#3A3A3B";

export const clickedItemBackgroundColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return CLICKED_ITEM_BACKGROUND_DARK;
  return CLICKED_ITEM_BACKGROUND_LIGHT;
};

const LIST_ITEM_SEPARATOR_LIGHT = "#b2b2b2";
const LIST_ITEM_SEPARATOR_DARK = "#3A3A3B";

export const listItemSeparatorColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return LIST_ITEM_SEPARATOR_DARK;
  return LIST_ITEM_SEPARATOR_LIGHT;
};

const ITEM_SEPARATOR_LIGHT = "#D1D1D5";
const ITEM_SEPARATOR_DARK = "#3A3A3B";

export const itemSeparatorColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return ITEM_SEPARATOR_DARK;
  return ITEM_SEPARATOR_LIGHT;
};

const MESSAGE_BUBBLE_LIGHT = "#E9E9EB";
const MESSAGE_BUBBLE_DARK = "#262628";

export const messageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return MESSAGE_BUBBLE_DARK;
  return MESSAGE_BUBBLE_LIGHT;
};

const MY_MESSAGE_BUBBLE_LIGHT = "#E95C43";
const MY_MESSAGE_BUBBLE_DARK = "#E95C43";

export const myMessageBubbleColor = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return MY_MESSAGE_BUBBLE_DARK;
  return MY_MESSAGE_BUBBLE_LIGHT;
};

const TABLE_VIEW_ITEM_BACKGROUND_LIGHT = "#F2F2F6";
const TABLE_VIEW_ITEM_BACKGROUND_DARK = "#1C1C1E";

export const tableViewItemBackground = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return TABLE_VIEW_ITEM_BACKGROUND_DARK;
  return TABLE_VIEW_ITEM_BACKGROUND_LIGHT;
};

const BUTTON_GREY_BACKGROUND_LIGHT = "#F2F2F7";
const BUTTON_GREY_BACKGROUND_DARK = "#F2F2F7";

export const buttonGreyBackground = (colorScheme: ColorSchemeName) => {
  if (colorScheme === "dark") return BUTTON_GREY_BACKGROUND_DARK;
  return BUTTON_GREY_BACKGROUND_LIGHT;
};
