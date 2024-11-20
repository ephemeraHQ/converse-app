import { useSnackbars } from "@components/Snackbar/Snackbar.service";
import { useGradientHeight } from "@components/Snackbar/SnackbarBackdrop/SnackbarBackdrop.utils";
import { AnimatedVStack } from "@design-system/VStack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";

/**
 * On Android, blur doesn't work
 */

export const SnackbarBackdrop = () => {
  const snackbars = useSnackbars();

  const { height: windowHeight } = useWindowDimensions();

  const gradientHeight = useGradientHeight();

  const rAnimatedStyle = useAnimatedStyle(() => {
    const top = windowHeight - gradientHeight;
    return {
      top: withTiming(top, {
        duration: 500,
      }),
    };
  }, [windowHeight, snackbars.length]);

  // Don't render if there are no snackbars
  if (snackbars.length === 0) {
    return null;
  }

  return (
    <AnimatedVStack
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, rAnimatedStyle]}
    >
      <LinearGradient
        locations={[0, 0.55]}
        colors={["rgba(255, 255,255,0.0)", "rgba(255, 255,255,0.5)"]}
        style={StyleSheet.absoluteFill}
      />
    </AnimatedVStack>
  );
};
