// import { TextStyle, ViewStyle } from "react-native";
// import { $globalStyles } from "../../theme/styles";
// import { ThemedStyle, ThemedStyleArray } from "../../theme/useAppTheme";
// import { IButtonPresets } from "./CustomButton.props";

// const $baseViewStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
//   minHeight: 56,
//   borderRadius: 4,
//   justifyContent: "center",
//   alignItems: "center",
//   paddingVertical: spacing.sm,
//   paddingHorizontal: spacing.sm,
//   overflow: "hidden",
// });

// const $baseTextStyle: ThemedStyle<TextStyle> = ({ typography }) => ({
//   fontSize: 16,
//   lineHeight: 20,
//   fontFamily: typography.primary.medium,
//   textAlign: "center",
//   flexShrink: 1,
//   flexGrow: 0,
//   zIndex: 2,
// });

// export const $buttonRightAccessoryStyle: ThemedStyle<ViewStyle> = ({
//   spacing,
// }) => ({
//   marginStart: spacing.xs,
//   zIndex: 1,
// });

// export const $buttonLeftAccessoryStyle: ThemedStyle<ViewStyle> = ({
//   spacing,
// }) => ({
//   marginEnd: spacing.xs,
//   zIndex: 1,
// });

// export const $buttonViewPresets: Record<
//   IButtonPresets,
//   ThemedStyleArray<ViewStyle>
// > = {
//   default: [
//     $globalStyles.row,
//     $baseViewStyle,
//     ({ colors }) => ({
//       borderWidth: 1,
//       borderColor: colors.palette.neutral400,
//       backgroundColor: colors.palette.neutral100,
//     }),
//   ],

//   filled: [
//     $globalStyles.row,
//     $baseViewStyle,
//     ({ colors }) => ({ backgroundColor: colors.palette.neutral300 }),
//   ],

//   reversed: [
//     $globalStyles.row,
//     $baseViewStyle,
//     ({ colors }) => ({ backgroundColor: colors.palette.neutral800 }),
//   ],
// };

// export const $buttonTextPresets: Record<
//   IButtonPresets,
//   ThemedStyleArray<TextStyle>
// > = {
//   default: [$baseTextStyle],
//   filled: [$baseTextStyle],
//   reversed: [
//     $baseTextStyle,
//     ({ colors }) => ({ color: colors.palette.neutral100 }),
//   ],
// };

// export const $buttonPressedViewPresets: Record<
//   IButtonPresets,
//   ThemedStyle<ViewStyle>
// > = {
//   default: ({ colors }) => ({ backgroundColor: colors.palette.neutral200 }),
//   filled: ({ colors }) => ({ backgroundColor: colors.palette.neutral400 }),
//   reversed: ({ colors }) => ({ backgroundColor: colors.palette.neutral700 }),
// };

// export const $buttonPressedTextPresets: Record<
//   IButtonPresets,
//   ThemedStyle<ViewStyle>
// > = {
//   default: () => ({ opacity: 0.9 }),
//   filled: () => ({ opacity: 0.9 }),
//   reversed: () => ({ opacity: 0.9 }),
// };
