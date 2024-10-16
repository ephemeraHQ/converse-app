// import { useAppTheme } from "@theme/useAppTheme";
// import {
//   PressableStateCallbackType,
//   StyleProp,
//   TextStyle,
//   ViewStyle,
// } from "react-native";
// import { Pressable } from "../Pressable";
// import { Text } from "../Text";
// import { IButtonProps, IButtonPresets } from "./CustomButton.props";
// import {
//   $buttonLeftAccessoryStyle,
//   $buttonPressedTextPresets,
//   $buttonPressedViewPresets,
//   $buttonRightAccessoryStyle,
//   $buttonTextPresets,
//   $buttonViewPresets,
// } from "./CustomButton.styles";

// export function CustomButton(props: IButtonProps) {
//   const {
//     tx,
//     text,
//     txOptions,
//     style: $viewStyleOverride,
//     pressedStyle: $pressedViewStyleOverride,
//     textStyle: $textStyleOverride,
//     pressedTextStyle: $pressedTextStyleOverride,
//     disabledTextStyle: $disabledTextStyleOverride,
//     children,
//     RightAccessory,
//     LeftAccessory,
//     disabled,
//     disabledStyle: $disabledViewStyleOverride,
//     ...rest
//   } = props;

//   const { themed } = useAppTheme();

//   const preset: IButtonPresets = props.preset ?? "default";

//   function $viewStyle({
//     pressed,
//   }: PressableStateCallbackType): StyleProp<ViewStyle> {
//     return [
//       themed($buttonViewPresets[preset]),
//       $viewStyleOverride,
//       !!pressed &&
//         themed([$buttonPressedViewPresets[preset], $pressedViewStyleOverride]),
//       !!disabled && $disabledViewStyleOverride,
//     ];
//   }

//   function $textStyle({
//     pressed,
//   }: PressableStateCallbackType): StyleProp<TextStyle> {
//     return [
//       themed($buttonTextPresets[preset]),
//       $textStyleOverride,
//       !!pressed &&
//         themed([$buttonPressedTextPresets[preset], $pressedTextStyleOverride]),
//       !!disabled && $disabledTextStyleOverride,
//     ];
//   }

//   return (
//     <Pressable
//       style={$viewStyle}
//       accessibilityRole="button"
//       accessibilityState={{ disabled: !!disabled }}
//       {...rest}
//       disabled={disabled}
//     >
//       {(state) => (
//         <>
//           {!!LeftAccessory && (
//             <LeftAccessory
//               style={$buttonLeftAccessoryStyle}
//               pressableState={state}
//               disabled={disabled}
//             />
//           )}

//           <Text
//             tx={tx}
//             text={text}
//             txOptions={txOptions}
//             style={$textStyle(state)}
//           >
//             {children}
//           </Text>

//           {!!RightAccessory && (
//             <RightAccessory
//               style={$buttonRightAccessoryStyle}
//               pressableState={state}
//               disabled={disabled}
//             />
//           )}
//         </>
//       )}
//     </Pressable>
//   );
// }
