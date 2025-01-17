import { IconButton } from "@/design-system/IconButton/IconButton";
import { IIconButtonProps } from "@/design-system/IconButton/IconButton.props";
import { memo } from "react";
import { ViewStyle } from "react-native";

const $defaultStyle: ViewStyle = {
  alignSelf: "center",
};

export const OnboardingIconButton = memo(function OnboardingIconButton(
  props: IIconButtonProps
) {
  const { style, ...rest } = props;
  return <IconButton style={[$defaultStyle, style]} {...rest} />;
});
