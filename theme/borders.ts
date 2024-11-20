import { StyleSheet } from "react-native";

export const borderWidth = {
  hairline: StyleSheet.hairlineWidth,
  sm: 1,
  md: 2,
  lg: 3,
} as const;

export type IBorderWidth = typeof borderWidth;
