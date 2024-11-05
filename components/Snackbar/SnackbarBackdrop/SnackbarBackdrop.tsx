import {
  SNACKBARS_MAX_VISIBLE,
  SNACKBAR_LARGE_TEXT_HEIGHT,
  SNACKBAR_SPACE_BETWEEN_SNACKBARS,
} from "@components/Snackbar/Snackbar.constants";
import { useSnackbars } from "@components/Snackbar/Snackbar.service";
import { useGradientHeight } from "@components/Snackbar/SnackbarBackdrop/SnackbarBackdrop.utils";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// The Backdrop component creates a visually appealing background for stacked snackbars.
// It uses a combination of a masked view, linear gradient, and blur effect to create
// a semi-transparent, animated backdrop that adjusts based on the number of snackbars.
// The backdrop animates from the bottom of the screen, creating a smooth transition
// as snackbars are added or removed.

export const SnackbarBackdrop = memo(() => {
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

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        rAnimatedStyle,
        // debugBorder()
      ]}
    >
      <MaskedView
        pointerEvents="none"
        maskElement={
          <LinearGradient
            locations={[0, 0.55]}
            colors={["rgba(255, 255,255,0.0)", "rgba(255, 255,255,1)"]}
            style={StyleSheet.absoluteFill}
          />
        }
        style={{
          height:
            (SNACKBAR_LARGE_TEXT_HEIGHT + SNACKBAR_SPACE_BETWEEN_SNACKBARS) *
              SNACKBARS_MAX_VISIBLE +
            90,
          width: "100%",
        }}
      >
        <BlurView
          intensity={80}
          tint="systemChromeMaterialLight"
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
    </Animated.View>
  );
});
