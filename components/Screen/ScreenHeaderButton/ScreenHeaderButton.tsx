import { memo } from "react";
import { Button, useColorScheme } from "react-native";

import { IScreenHeaderButtonProps } from "./ScreenHeaderButton.props";
import { textPrimaryColor } from "../../../styles/colors";

export const ScreenHeaderButton = memo(function ScreenHeaderButton(
  props: IScreenHeaderButtonProps
) {
  const colorScheme = useColorScheme();
  return <Button color={textPrimaryColor(colorScheme)} {...props} />;
});
