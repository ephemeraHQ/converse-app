import { Button } from "@design-system/Button/Button"
import { Center } from "@design-system/Center"
import { AnimatedHStack, HStack } from "@design-system/HStack"
import { IconButton } from "@design-system/IconButton/IconButton"
import { Text } from "@design-system/Text"
import { AnimatedVStack } from "@design-system/VStack"
import { SICK_SPRING_CONFIG } from "@theme/animations"
import { memo, useCallback, useEffect } from "react"
import { useWindowDimensions } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import {
  SNACKBAR_BOTTOM_OFFSET,
  SNACKBAR_HEIGHT,
  SNACKBAR_LARGE_TEXT_HEIGHT,
  SNACKBAR_SPACE_BETWEEN_SNACKBARS,
  SNACKBARS_MAX_VISIBLE,
} from "@/components/snackbar/snackbar.constants"
import { getNumberOfSnackbars, onSnackbarsChange } from "@/components/snackbar/snackbar.service"
import { ISnackbar } from "@/components/snackbar/snackbar.types"
import { useAnimatedKeyboard } from "@/hooks/use-animated-keyboard"
import { useAppTheme } from "@/theme/use-app-theme"

type SnackbarProps = {
  snackbar: ISnackbar
  onDismiss: () => void
}

export const Snackbar = memo(
  function Snackbar(props: SnackbarProps) {
    const { snackbar, onDismiss } = props
    const { theme } = useAppTheme()
    const { width: windowWidth } = useWindowDimensions()

    const { progressAV, keyboardHeightAV } = useAnimatedKeyboard()

    const isFirstSnack = getNumberOfSnackbars() === 1
    const initialBottomPosition = isFirstSnack ? -SNACKBAR_HEIGHT / 2 : SNACKBAR_BOTTOM_OFFSET

    const snackbarIndexAV = useSharedValue(0)
    const bottomAV = useSharedValue(initialBottomPosition)
    const translateXAV = useSharedValue(0)
    const isSwipingAV = useSharedValue(false)
    const firstSnackbarRenderProgressAV = useSharedValue(
      // We only want the first snackbar to animate in with a special animation
      isFirstSnack ? 0 : 1,
    )

    useEffect(() => {
      bottomAV.value = withSpring(SNACKBAR_BOTTOM_OFFSET, SICK_SPRING_CONFIG)
      firstSnackbarRenderProgressAV.value = withSpring(1, SICK_SPRING_CONFIG)
    }, [bottomAV, firstSnackbarRenderProgressAV])

    useEffect(() => {
      const unsubscribe = onSnackbarsChange((snackbars) => {
        const snackbarIndex = snackbars.findIndex((item) => item.key === snackbar.key)

        // Set the new new index of the current snackbar
        snackbarIndexAV.value = withSpring(snackbarIndex, SICK_SPRING_CONFIG)

        if (snackbarIndex === -1) {
          return
        }

        const totalHeightBeforeThisSnackbar = snackbars
          .slice(0, Math.min(snackbarIndex, SNACKBARS_MAX_VISIBLE))
          .reduce((acc, item) => {
            const snackbarHeight = item.isMultiLine ? SNACKBAR_LARGE_TEXT_HEIGHT : SNACKBAR_HEIGHT
            return acc + snackbarHeight + SNACKBAR_SPACE_BETWEEN_SNACKBARS
          }, 0)

        bottomAV.value = withSpring(
          SNACKBAR_BOTTOM_OFFSET + totalHeightBeforeThisSnackbar,
          SICK_SPRING_CONFIG,
        )
      })

      return unsubscribe
    }, [snackbar.key, bottomAV, snackbarIndexAV])

    const dismissItem = useCallback(() => {
      "worklet"
      translateXAV.value = withTiming(-windowWidth, { duration: 250 }, (isFinished) => {
        if (isFinished) {
          runOnJS(onDismiss)()
        }
      })
    }, [onDismiss, translateXAV, windowWidth])

    const gesture = Gesture.Pan()
      .onBegin(() => {
        isSwipingAV.value = true
      })
      .onUpdate((event) => {
        if (event.translationX <= 0) {
          translateXAV.value = event.translationX
        }
      })
      .onEnd((event) => {
        if (event.translationX < -50) {
          dismissItem()
        } else {
          translateXAV.value = withSpring(0)
        }
      })
      .onFinalize(() => {
        isSwipingAV.value = false
      })

    const containerAS = useAnimatedStyle(
      () => ({
        bottom: bottomAV.value + theme.spacing.md + keyboardHeightAV.value,
        zIndex: withTiming(100 - snackbarIndexAV.value),
        // Animate shadow radius based on snackbar position in stack
        // - Starts at 16 for first snackbar and decreases by 2.5 for each subsequent one
        // - Has minimum value of 2 to maintain some depth
        shadowRadius: interpolate(snackbarIndexAV.value, [0, 10], [16, 2]),
        // Animate shadow opacity based on snackbar position
        // - First 3 snackbars have opacity of 1
        // - After 3rd snackbar, opacity decreases linearly by 0.05
        // - This creates a nice fading effect for stacked snackbars
        shadowOpacity: interpolate(snackbarIndexAV.value, [0, 3, 10], [1, 1, 0]),
        // The content of the first two StackedToasts is visible
        // The content of the other StackedToasts is hidden
        opacity: interpolate(
          snackbarIndexAV.value,
          [0, SNACKBARS_MAX_VISIBLE - 1, SNACKBARS_MAX_VISIBLE],
          [1, 1, 0],
        ),
        transform: [
          // For the dragging animation
          { translateX: translateXAV.value },
          {
            scale: interpolate(firstSnackbarRenderProgressAV.value, [0, 1], [0.9, 1]),
          },
        ],
      }),
      [],
    )

    const SnackContainer = snackbar.isMultiLine ? AnimatedVStack : AnimatedHStack
    const snackbarHeight = snackbar.isMultiLine ? SNACKBAR_LARGE_TEXT_HEIGHT : SNACKBAR_HEIGHT

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
                  flex: 1,
                  paddingHorizontal: theme.spacing.xs,
                  ...(snackbar.isMultiLine && { paddingTop: theme.spacing.xs }),
                }}
              >
                <Text
                  preset="small"
                  numberOfLines={2}
                  {...(snackbar.type === "error" && { color: "caution" })}
                >
                  {snackbar.message}
                </Text>
              </HStack>

              <HStack
                style={{
                  // ...debugBorder(),
                  alignSelf: "flex-end",
                  columnGap: theme.spacing.xxxs,
                  alignItems: "center",
                  ...(!snackbar.isMultiLine && { height: "100%" }),
                  ...(snackbar.isMultiLine && {
                    flex: 1,
                    paddingBottom: theme.spacing.xxxs,
                  }),
                }}
              >
                {snackbar.actions?.map((action) => (
                  <Button
                    hitSlop={theme.spacing.xxs}
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
                    hitSlop={theme.spacing.xxs}
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
    )
  },
  // We don't need to rerender a snackbar
  () => true,
)
