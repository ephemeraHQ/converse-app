import React, { memo, PropsWithChildren } from "react";
import { Dimensions, ViewStyle } from "react-native";
import { useAppTheme, useThemeProvider } from "@/theme/useAppTheme";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type IAnimatedCardContainerProps = PropsWithChildren & {
  style?: ViewStyle;
};

/**
 * AnimatedCardContainer Component
 *
 * A component that provides the 3D card animation and theme context.
 * Wraps any content in a gesture detector and animates it when swiped.
 */
const AnimatedCardContainerWithoutThemeProvider = memo(
  function AnimatedCardContainerWithoutThemeProvider({
    children,
    style,
  }: IAnimatedCardContainerProps) {
    const { theme } = useAppTheme();

    const { width: screenWidth } = Dimensions.get("window");

    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const shadowOffsetX = useSharedValue(0);
    const shadowOffsetY = useSharedValue(6);

    const baseStyle = {
      backgroundColor: theme.colors.fill.inverted.primary,
      borderRadius: theme.borderRadius.xxs,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.fill.inverted.primary,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
      // Maintains credit card aspect ratio
      height: (screenWidth - 2 * theme.spacing.lg) * 0.64,
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { perspective: 800 },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
      shadowOffset: {
        width: shadowOffsetX.value,
        height: shadowOffsetY.value,
      },
      ...baseStyle,
      ...style,
    }));

    const panGesture = Gesture.Pan()
      .onBegin(() => {
        rotateX.value = withSpring(0);
        rotateY.value = withSpring(0);
        shadowOffsetX.value = withSpring(0);
        shadowOffsetY.value = withSpring(0);
      })
      .onUpdate((event) => {
        rotateX.value = event.translationY / 10;
        rotateY.value = event.translationX / 10;
        shadowOffsetX.value = -event.translationX / 20;
        shadowOffsetY.value = event.translationY / 20;
      })
      .onEnd(() => {
        rotateX.value = withSpring(0);
        rotateY.value = withSpring(0);
        shadowOffsetX.value = withSpring(0);
        shadowOffsetY.value = withSpring(0);
      });

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    );
  }
);

export const AnimatedCardContainer = memo(function AnimatedCardContainer({
  children,
  style,
}: IAnimatedCardContainerProps) {
  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();
  const invertedTheme = themeScheme === "light" ? "dark" : "light";

  return (
    <ThemeProvider
      value={{ themeScheme: invertedTheme, setThemeContextOverride }}
    >
      <AnimatedCardContainerWithoutThemeProvider style={style}>
        {children}
      </AnimatedCardContainerWithoutThemeProvider>
    </ThemeProvider>
  );
});
