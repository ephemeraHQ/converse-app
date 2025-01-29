import { ILoaderSize } from "@/theme/loader";
import { useAppTheme } from "@/theme/useAppTheme";
import {
  Canvas,
  Path,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { memo, useEffect, useMemo } from "react";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type INewLoaderProps = {
  size?: keyof ILoaderSize;
};

export const NewLoader = memo(function NewLoader({
  size = "md",
}: INewLoaderProps) {
  const { theme } = useAppTheme();
  const sizeValue = theme.loaderSize[size];
  const strokeWidth = Math.max(sizeValue * 0.1, 2);
  const radius = (sizeValue - strokeWidth) / 2;
  const canvasPadding = sizeValue * 0.15;
  const canvasSize = sizeValue + canvasPadding;

  const circle = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(canvasSize / 2, canvasSize / 2, radius);
    return path;
  }, [canvasSize, radius]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${2 * Math.PI * progress.value}rad` }],
  }));

  const startPath = useDerivedValue(
    () => interpolate(progress.value, [0, 0.5, 1], [0.6, 0.3, 0.6]),
    []
  );

  return (
    <Animated.View
      entering={FadeIn.duration(1000)}
      exiting={FadeOut.duration(1000)}
      style={animatedStyle}
    >
      <Canvas
        style={{
          width: canvasSize,
          height: canvasSize,
        }}
      >
        <Path
          path={circle}
          color="red"
          style="stroke"
          strokeWidth={strokeWidth}
          start={startPath}
          end={1}
          strokeCap="round"
        >
          <SweepGradient
            c={vec(canvasSize / 2, canvasSize / 2)}
            colors={[theme.colors.text.primary, theme.colors.text.secondary]}
          />
        </Path>
      </Canvas>
    </Animated.View>
  );
});
