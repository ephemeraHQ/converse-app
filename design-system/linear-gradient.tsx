import {
  LinearGradient as ExpoLinearGradient,
  LinearGradientProps as ExpoLinearGradientProps,
} from "expo-linear-gradient";
import { memo } from "react";

type ILinearGradientProps = ExpoLinearGradientProps & {
  isAbsoluteFill?: boolean;
  orientation?: "vertical" | "horizontal";
};

export const LinearGradient = memo(function LinearGradient(
  props: ILinearGradientProps
) {
  const {
    isAbsoluteFill,
    orientation = "vertical",

    colors,
    ...rest
  } = props;

  const start =
    rest.start ??
    (orientation === "vertical" ? { x: 0, y: 0 } : { x: 0, y: 0 });
  const end =
    rest.end ?? (orientation === "vertical" ? { x: 0, y: 1 } : { x: 1, y: 0 });

  return (
    <ExpoLinearGradient
      {...rest}
      colors={colors}
      start={start}
      end={end}
      style={[
        isAbsoluteFill && {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        rest.style,
      ]}
    />
  );
});
