import { AnimatedCenter, Center } from "@/design-system/Center";
import { AnimatedText, Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { Loader } from "@/design-system/loader";
import { ConversationListEmpty } from "@/features/conversation-list/conversation-list-empty";
import { $globalStyles } from "@/theme/styles";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
import { useHeaderHeight } from "@react-navigation/elements";
import React, { memo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ConversationListLoading = memo(function ConversationListLoading() {
  const headerHeight = useHeaderHeight();

  const insets = useSafeAreaInsets();

  const countTextAV = useDerivedValue(() => {
    // Format time as "00.00.000"
    const timeInMs = Date.now() % 60000; // Get milliseconds within a minute
    const seconds = Math.floor(timeInMs / 1000);
    const milliseconds = timeInMs % 1000;

    return `${String(Math.floor(seconds / 10)).padStart(1, "0")}${
      seconds % 10
    }.${String(milliseconds).padStart(3, "0")}`;
  }, []);

  return (
    <VStack style={$globalStyles.flex1}>
      <ConversationListEmpty />
      <VStack
        {...debugBorder()}
        style={[
          $globalStyles.absoluteFill,
          {
            alignItems: "center",
            justifyContent: "center",
            // To make sure the loader is centered based on the screen height
            bottom: headerHeight + insets.top,
          },
        ]}
      >
        {/* <Loader /> */}
        <ArcLoader />
        <Text preset="bodyBold">Hello</Text>
        <Text color="secondary" preset="small">
          Gathering your messages
        </Text>
        {/* <AnimatedText text={countTextAV} /> */}
      </VStack>
    </VStack>
  );
});

const ArcLoader = () => {
  const { themed } = useAppTheme();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    const timingConfig = {
      duration: 1500, // Slower duration for smoother feel
    };

    rotation.value = withSequence(
      withTiming(0, timingConfig),
      withRepeat(
        withTiming(360, {
          duration: 1500,
          // Use bezier curve for smoother animation
          easing: Easing.bezier(0.35, 0.7, 0.5, 0.7),
        }),
        -1, // Infinite loop
        false // Don't reverse
      )
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <AnimatedCenter style={[themed($arc), animatedStyle]} />;
};

const $arc: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 80,
  height: 80,
  borderWidth: 8,
  borderRadius: 40,
  borderColor: "transparent",
  borderTopColor: colors.text.primary,
  borderLeftColor: colors.text.primary,
  borderBottomColor: colors.text.primary,
  borderTopLeftRadius: 40,
  borderTopRightRadius: 40,
  borderBottomLeftRadius: 40,
  borderBottomRightRadius: 40,
});
