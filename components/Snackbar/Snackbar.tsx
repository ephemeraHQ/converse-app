import {
  SNACKBARS_MAX_VISIBLE,
  SNACKBAR_BOTTOM_OFFSET,
  SNACKBAR_HEIGHT,
  SNACKBAR_LARGE_TEXT_HEIGHT,
} from "@components/Snackbar/Snackbar.constants";
import {
  getNumberOfSnackbars,
  onSnackbarsChange,
} from "@components/Snackbar/Snackbar.service";
import { ISnackbar } from "@components/Snackbar/Snackbar.types";
import { Button } from "@design-system/Button/Button";
import { Center } from "@design-system/Center";
import { AnimatedHStack, HStack } from "@design-system/HStack";
import { IconButton } from "@design-system/IconButton/IconButton";
import { Text } from "@design-system/Text";
import { AnimatedVStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { memo, useCallback, useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SNACKBAR_SPACE_BETWEEN_SNACKBARS } from "./Snackbar.constants";

const withSpringConfig = {
  duration: 500,
  dampingRatio: 1.5,
  stiffness: 1,
  overshootClamping: false,
  restSpeedThreshold: 50,
};

type SnackbarProps = {
  snackbar: ISnackbar;
  onDismiss: () => void;
};

export const Snackbar = memo(
  function Snackbar(props: SnackbarProps) {
    const { snackbar, onDismiss } = props;
    const { theme } = useAppTheme();
    const { width: windowWidth } = useWindowDimensions();

    const isFirstSnack = getNumberOfSnackbars() === 1;
    const initialBottomPosition = isFirstSnack
      ? -SNACKBAR_HEIGHT
      : SNACKBAR_BOTTOM_OFFSET;

    const snackbarIndexAV = useSharedValue(0);
    const bottomAV = useSharedValue(initialBottomPosition);
    const translateXAV = useSharedValue(0);
    const isSwipingAV = useSharedValue(false);

    useEffect(() => {
      bottomAV.value = withSpring(SNACKBAR_BOTTOM_OFFSET, withSpringConfig);
    }, [bottomAV]);

    useEffect(() => {
      const unsubscribe = onSnackbarsChange((snackbars) => {
        const snackbarIndex = snackbars.findIndex(
          (item) => item.key === snackbar.key
        );

        console.log("snackbarIndex:", snackbarIndex);

        // Set the new new index of the current snackbar
        snackbarIndexAV.value = snackbarIndex;

        if (snackbarIndex === -1) {
          return;
        }

        const totalHeightBeforeThisSnackbar = snackbars
          .slice(0, Math.min(snackbarIndex, SNACKBARS_MAX_VISIBLE))
          .reduce((acc, item) => {
            const snackbarHeight = item.isMultiLine
              ? SNACKBAR_LARGE_TEXT_HEIGHT
              : SNACKBAR_HEIGHT;
            return acc + snackbarHeight + SNACKBAR_SPACE_BETWEEN_SNACKBARS;
          }, 0);

        bottomAV.value = withSpring(
          SNACKBAR_BOTTOM_OFFSET + totalHeightBeforeThisSnackbar,
          withSpringConfig
        );
      });

      return unsubscribe;
    }, [snackbar.key, bottomAV, snackbarIndexAV]);

    const dismissItem = useCallback(() => {
      "worklet";
      translateXAV.value = withTiming(
        -windowWidth,
        { duration: 250 },
        (isFinished) => {
          if (isFinished) {
            runOnJS(onDismiss)();
          }
        }
      );
    }, [onDismiss, translateXAV, windowWidth]);

    const gesture = Gesture.Pan()
      .onBegin(() => {
        isSwipingAV.value = true;
      })
      .onUpdate((event) => {
        if (event.translationX <= 0) {
          translateXAV.value = event.translationX;
        }
      })
      .onEnd((event) => {
        if (event.translationX < -50) {
          dismissItem();
        } else {
          translateXAV.value = withSpring(0);
        }
      })
      .onFinalize(() => {
        isSwipingAV.value = false;
      });

    const containerAS = useAnimatedStyle(
      () => ({
        bottom: bottomAV.value + theme.spacing.md,
        zIndex: withTiming(100 - snackbarIndexAV.value),
        // Animate shadow radius based on snackbar position in stack
        // - Starts at 16 for first snackbar and decreases by 2.5 for each subsequent one
        // - Has minimum value of 2 to maintain some depth
        shadowRadius: withTiming(Math.max(16 - snackbarIndexAV.value * 2.5, 2)),
        // Animate shadow opacity based on snackbar position
        // - First 3 snackbars have opacity of 1
        // - After 3rd snackbar, opacity decreases linearly by 0.05
        // - This creates a nice fading effect for stacked snackbars
        shadowOpacity: withTiming(
          snackbarIndexAV.value > 3 ? 1 - snackbarIndexAV.value * 0.15 : 1
        ),
        // The content of the first two StackedToasts is visible
        // The content of the other StackedToasts is hidden
        opacity: withTiming(
          snackbarIndexAV.value < SNACKBARS_MAX_VISIBLE ? 1 : 0
        ),
        // For the dragging animation
        transform: [{ translateX: translateXAV.value }],
      }),
      []
    );

    const SnackContainer = snackbar.isMultiLine
      ? AnimatedVStack
      : AnimatedHStack;
    const snackbarHeight = snackbar.isMultiLine
      ? SNACKBAR_LARGE_TEXT_HEIGHT
      : SNACKBAR_HEIGHT;

    return (
      <GestureDetector gesture={gesture}>
        <AnimatedVStack
          style={[
            {
              // ...debugBorder(),
              left: theme.spacing.md,
              zIndex: -1,
              position: "absolute",
              width: windowWidth - theme.spacing.md * 2,
              backgroundColor: theme.colors.background.surface,
              borderRadius: theme.borderRadius.sm,
              borderCurve: "continuous",
              ...theme.shadow.big,
            },
            containerAS,
          ]}
        >
          <AnimatedVStack>
            <SnackContainer
              style={{
                // ...debugBorder(),
                marginHorizontal: theme.spacing.xxs,
                borderCurve: "continuous",
                overflow: "hidden",
                borderRadius: theme.borderRadius.sm,
                height: snackbarHeight,
                paddingHorizontal: theme.spacing.xxxs,
                ...(!snackbar.isMultiLine && { alignItems: "center" }),
              }}
            >
              <HStack
                style={{
                  paddingHorizontal: theme.spacing.xs,
                  ...(!snackbar.isMultiLine && { flex: 1 }),
                  ...(snackbar.isMultiLine && { paddingTop: theme.spacing.xs }),
                }}
              >
                <Text
                  preset="small"
                  numberOfLines={snackbar.isMultiLine ? 2 : 1}
                  {...(snackbar.type === "error" && { color: "caution" })}
                >
                  {snackbar.message}
                </Text>
              </HStack>

              <HStack
                style={{
                  alignSelf: "flex-end",
                  columnGap: theme.spacing.xxxs,
                  alignItems: "center",
                  ...(!snackbar.isMultiLine && { height: "100%" }),
                }}
              >
                {snackbar.actions?.map((action) => (
                  <Button
                    withHapticFeedback
                    key={action.label}
                    text={action.label}
                    variant="link"
                    size="sm"
                    onPress={action.onPress}
                    textStyle={{ color: theme.colors.text.secondary }}
                  />
                ))}

                <Center
                  style={{
                    marginLeft: theme.spacing.xxxs,
                    width: theme.spacing.xxl,
                    height: theme.spacing.xxl,
                  }}
                >
                  <IconButton
                    withHaptics
                    onPress={dismissItem}
                    variant="ghost"
                    iconName="xmark"
                    size="md"
                  />
                </Center>
              </HStack>
            </SnackContainer>
          </AnimatedVStack>
        </AnimatedVStack>
      </GestureDetector>
    );
  },
  // We don't need to rerender a snackbar
  () => true
);
