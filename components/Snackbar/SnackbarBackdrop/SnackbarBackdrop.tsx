import { SNACKBAR_BACKDROP_MAX_HEIGHT } from "@components/Snackbar/Snackbar.constants";
import { useSnackbars } from "@components/Snackbar/Snackbar.service";
import { useGradientHeight } from "@components/Snackbar/SnackbarBackdrop/SnackbarBackdrop.utils";
import MaskedView from "@react-native-masked-view/masked-view";
import { SICK_SPRING_CONFIG } from "@theme/animations";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
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
      top: withSpring(top, SICK_SPRING_CONFIG),
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
          height: Math.min(gradientHeight * 1.5, SNACKBAR_BACKDROP_MAX_HEIGHT),
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
