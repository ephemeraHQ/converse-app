// import { useAppTheme } from "@theme/useAppTheme";
// import React, { useCallback } from "react";
// import { Button as MaterialButton } from "react-native-paper";
// import logger from "../../utils/logger";
// import { IButtonProps } from "./CustomButton.props";
// import { $buttonTextPresets, $buttonViewPresets } from "./CustomButton.styles";

// export function Button(props: IButtonProps) {
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
//     preset = "default",
//     ...rest
//   } = props;

//   const { themed } = useAppTheme();

//   const $viewStyle = [
//     themed($buttonViewPresets[preset]),
//     $viewStyleOverride,
//     disabled && $disabledViewStyleOverride,
//   ];

//   const $textStyle = [
//     themed($buttonTextPresets[preset]),
//     $textStyleOverride,
//     disabled && $disabledTextStyleOverride,
//   ];

//   const content = tx
//     ? { tx, txOptions }
//     : text
//     ? { children: text }
//     : { children };

//   if (RightAccessory) {
//     logger.warn("RightAccessory is not supported on Android");
//   }

//   const renderIcon = useCallback(
//     ({ color, size }) => {
//       if (!LeftAccessory) return null;
//       return (
//         <LeftAccessory
//           style={themed(({ spacing }) => ({ marginRight: spacing.xs }))}
//           pressableState={{ pressed: false }}
//           disabled={disabled}
//         />
//       );
//     },
//     [LeftAccessory, disabled]
//   );

//   return (
//     <MaterialButton
//       mode={
//         preset === "filled"
//           ? "contained"
//           : preset === "reversed"
//           ? "contained-tonal"
//           : "outlined"
//       }
//       disabled={disabled}
//       onPress={rest.onPress}
//       style={$viewStyle}
//       labelStyle={$textStyle}
//       icon={renderIcon}
//       contentStyle={{ flexDirection: "row", alignItems: "center" }}
//       {...rest}
//     >
//       {content}
//     </MaterialButton>
//   );
// }
