import { memo } from "react";
import { ActivityIndicator, StyleProp, ViewStyle } from "react-native";

type ILoaderProps = {
  /**
   * Size of the indicator.
   * Small has a height of 20, large has a height of 36.
   */
  size?: "small" | "large";
  /**
   * Whether to show the indicator (true) or hide it (false).
   */
  animating?: boolean;
  /**
   * The foreground color of the spinner.
   */
  color?: string;
  /**
   * Whether the indicator should hide when not animating.
   */
  hidesWhenStopped?: boolean;
  /**
   * Style of the loader
   */
  style?: StyleProp<ViewStyle>;
};

export const Loader = memo(function Loader(props: ILoaderProps) {
  const { size, animating, color, hidesWhenStopped, style } = props;
  return (
    <ActivityIndicator
      size={size}
      animating={animating}
      color={color}
      hidesWhenStopped={hidesWhenStopped}
      style={style}
    />
  );
});
