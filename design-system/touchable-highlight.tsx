import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";
import {
  TouchableHighlight as RNTouchableHighlight,
  TouchableHighlightProps,
} from "react-native";

export const TouchableHighlight = memo(function TouchableHighlight(
  props: TouchableHighlightProps
) {
  const { theme } = useAppTheme();
  return (
    <RNTouchableHighlight
      {...props}
      underlayColor={theme.colors.background.sunken}
    />
  );
});
