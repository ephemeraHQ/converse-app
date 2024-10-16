import { ColorSchemeName, Platform } from "react-native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

import { colors, MaterialLightColors } from "../../theme";
import { colorsDark, MaterialDarkColors } from "../../theme/colorsDark";

export const backgroundColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark" ? colorsDark.background : colors.background;
};

export const navigationSecondaryBackgroundColor = (
  colorScheme: ColorSchemeName
) => {
  return colorScheme === "dark"
    ? colorsDark.navigationSecondaryBackground
    : colors.navigationSecondaryBackground;
};

export const chatInputBackgroundColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.navigationSecondaryBackground
    : colors.navigationSecondaryBackground;
};

export const textPrimaryColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark" ? colorsDark.textPrimary : colors.textPrimary;
};

export const textSecondaryColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.textSecondary
    : colors.textSecondary;
};

export const actionSecondaryColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.actionSecondary
    : colors.actionSecondary;
};

export const clickedItemBackgroundColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.clickedItemBackground
    : colors.clickedItemBackground;
};

export const listItemSeparatorColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.listItemSeparator
    : colors.listItemSeparator;
};

export const itemSeparatorColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.itemSeparator
    : colors.itemSeparator;
};

export const messageBubbleColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.messageBubble
    : colors.messageBubble;
};

export const messageInnerBubbleColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.messageInnerBubble
    : colors.messageInnerBubble;
};

export const messageHighlightedBubbleColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark" ? "#3e3e41" : "#c9c9cf";
};

export const myMessageBubbleColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.myMessageBubble
    : colors.myMessageBubble;
};

export const myMessageInnerBubbleColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.myMessageInnerBubble
    : colors.myMessageInnerBubble;
};

export const myMessageHighlightedBubbleColor = (
  colorScheme: ColorSchemeName
) => {
  return "#b4402f";
};

export const tertiaryBackgroundColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark"
    ? colorsDark.tertiaryBackground
    : colors.tertiaryBackground;
};

export const primaryColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark" ? colorsDark.tint : colors.tint;
};

export const inversePrimaryColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark" ? colors.tint : colorsDark.tint;
};

export const badgeColor = (colorScheme: ColorSchemeName) => {
  return primaryColor(colorScheme);
};

export const dangerColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark" ? colorsDark.error : colors.error;
};

export const requestsTextColor = (colorScheme: ColorSchemeName) => {
  return colorScheme === "dark" ? colorsDark.requestsText : colors.requestsText;
};

export const MaterialLightTheme = {
  ...MD3LightTheme,
  colors: MaterialLightColors,
};

export const MaterialDarkTheme = {
  ...MD3DarkTheme,
  colors: MaterialDarkColors,
};

/**
 *
 * @param colorScheme
 * @returns
 */
export const headerTitleStyle = (colorScheme: ColorSchemeName) =>
  Platform.select({
    default: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      fontWeight: "600" as any,
      maxWidth: 150,
    },
    android: {
      color: textPrimaryColor(colorScheme),
      fontSize: 18,
      left: -15,
      fontFamily: "Roboto",
    },
    web: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      fontWeight: "600" as any,
    },
  });

export const actionSheetColors = (colorScheme: ColorSchemeName) =>
  Platform.OS === "android" || Platform.OS === "web"
    ? {
        containerStyle: {
          backgroundColor:
            colorScheme === "dark"
              ? MaterialDarkColors.elevation.level3
              : backgroundColor(colorScheme),
        },
        tintColor: textSecondaryColor(colorScheme),
        titleTextStyle: { color: textSecondaryColor(colorScheme) },
        messageTextStyle: { color: textSecondaryColor(colorScheme) },
      }
    : {};

export const textInputStyle = (colorScheme: ColorSchemeName) =>
  ({
    ...Platform.select({
      default: {
        backgroundColor: tertiaryBackgroundColor(colorScheme),
        borderRadius: 10,
        fontSize: 17,
      },
      android: {
        backgroundColor: backgroundColor(colorScheme),
        borderWidth: 1,
        borderRadius: 4,
        borderColor: textSecondaryColor(colorScheme),
        fontSize: 16,
      },
    }),
    alignContent: "flex-start",
    color: textPrimaryColor(colorScheme),
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
  }) as any;
