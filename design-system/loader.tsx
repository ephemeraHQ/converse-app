import { Canvas, Path, Skia, SweepGradient, vec } from "@shopify/react-native-skia"
import { memo, useEffect, useMemo } from "react"
import { StyleProp, ViewStyle } from "react-native"
import {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import { AnimatedVStack } from "@/design-system/VStack"
import { ILoaderSize } from "@/theme/loader"
import { useAppTheme } from "@/theme/use-app-theme"

type ILoaderProps = {
  size?: keyof ILoaderSize
  style?: StyleProp<ViewStyle>
}

export const Loader = memo(function Loader({ size = "md", style }: ILoaderProps) {
  const { theme } = useAppTheme()
  const sizeValue = theme.loaderSize[size]
  const strokeWidth = Math.max(sizeValue * 0.1, 2)
  const radius = (sizeValue - strokeWidth) / 2
  const canvasPadding = sizeValue * 0.15
  const canvasSize = sizeValue + canvasPadding

  const circle = useMemo(() => {
    const path = Skia.Path.Make()
    path.addCircle(canvasSize / 2, canvasSize / 2, radius)
    return path
  }, [canvasSize, radius])

  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    )
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${2 * Math.PI * progress.value}rad` }],
  }))

  const startPath = useDerivedValue(
    () => interpolate(progress.value, [0, 0.5, 1], [0.6, 0.3, 0.6]),
    [],
  )

  return (
    <AnimatedVStack
      entering={FadeIn.duration(theme.timing.slow)}
      style={[
        animatedStyle,
        {
          width: canvasSize,
          height: canvasSize,
        },
      ]}
    >
      <Canvas
        style={{
          width: canvasSize,
          height: canvasSize,
        }}
      >
        <Path
          path={circle}
          color={theme.colors.text.primary}
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
    </AnimatedVStack>
  )
})
