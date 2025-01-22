import React, { memo, PropsWithChildren } from "react";
import { Dimensions } from "react-native";
import { useAppTheme, useThemeProvider } from "@/theme/useAppTheme";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import logger from "@/utils/logger";

type IContactCardContainerProps = PropsWithChildren;

/**
 * ContactCardContainer Component
 *
 * A component that holds the contact card, wraps the contact card in a gesture detector, and animates the card when swiped
 * ather than passing a bunch of inverted props around, just creating a mini theme provider for it specifically
 */
const ContactCardContainerWithoutThemeProvider = memo(
  function ContactCardContainerWithoutThemeProvider({
    children,
  }: IContactCardContainerProps) {
    const { theme } = useAppTheme();
    logger.debug("ContactCardContainerWithoutThemeProvider", theme.isDark);

    const { width: screenWidth } = Dimensions.get("window");

    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const shadowOffsetX = useSharedValue(0);
    const shadowOffsetY = useSharedValue(6);

    const baseStyle = {
      backgroundColor: theme.colors.fill.inverted.primary,
      borderRadius: theme.borderRadius.xxs,
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.fill.inverted.primary,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
      // Maintains credit card aspect ratio
      height: (screenWidth - 2 * theme.spacing.lg) * 0.628,
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

export const ContactCardContainer = memo(function ContactCardContainer({
  children,
}: IContactCardContainerProps) {
  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();
  const invertedTheme = themeScheme === "light" ? "dark" : "light";

  return (
    <ThemeProvider
      value={{ themeScheme: invertedTheme, setThemeContextOverride }}
    >
      <ContactCardContainerWithoutThemeProvider>
        {children}
      </ContactCardContainerWithoutThemeProvider>
    </ThemeProvider>
  );
});
