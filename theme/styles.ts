import { ViewStyle } from "react-native";

/* Use this file to define styles that are used in multiple places in your app. */
export const $globalStyles = {
  row: { flexDirection: "row" } as ViewStyle,
  flex1: { flex: 1 } as ViewStyle,
  flexWrap: { flexWrap: "wrap" } as ViewStyle,
  alignCenter: { alignItems: "center" } as ViewStyle,
  justifyCenter: { justifyContent: "center" } as ViewStyle,
  center: {
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
};
