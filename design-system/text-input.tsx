import { textPresets } from "@/design-system/Text/Text.presets";
import { useAppTheme } from "@/theme/useAppTheme";
import { forwardRef, memo } from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
} from "react-native";

export type ITextInputProps = RNTextInputProps;

export const TextInput = memo(
  forwardRef(function TextInput(
    props: ITextInputProps,
    ref: React.ForwardedRef<RNTextInput>
  ) {
    const { theme, themed } = useAppTheme();

    const { style, cursorColor = theme.colors.text.primary, ...rest } = props;

    return (
      <RNTextInput
        cursorColor={cursorColor}
        selectionHandleColor={cursorColor}
        selectionColor={cursorColor as string} // Not sure why "as string" is required
        style={[
          themed(textPresets["body"]),
          { padding: 0 }, // We want fully control over our TextInput layout
          style,
        ]}
        {...rest}
        ref={ref}
      />
    );
  })
);
