import React, { useCallback, useRef } from "react"
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable"
import { SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated"

export type ISwipeableRenderActionsArgs = {
  progressAnimatedValue: SharedValue<number>
  dragAnimatedValue: SharedValue<number>
  swipeable: SwipeableMethods
}

export type ISwipeableProps = {
  // Action renderers
  renderLeftActions?: (args: ISwipeableRenderActionsArgs) => React.ReactNode
  renderRightActions?: (args: ISwipeableRenderActionsArgs) => React.ReactNode

  // Swipe callbacks
  onLeftSwipe?: () => void
  onRightSwipe?: () => void

  // Configuration
  /** Minimum swipe distance from left edge to trigger action */
  leftThreshold?: number
  /** Minimum swipe distance from right edge to trigger action */
  rightThreshold?: number
  /** Offset from left edge to trigger action */
  dragOffsetFromLeftEdge?: number
  /** Offset from right edge to trigger action */
  dragOffsetFromRightEdge?: number
  /** Friction for overshoot, default is 4 */
  overshootFriction?: number
  /** Whether to enable overshoot on the left side */
  overshootLeft?: boolean
  /** Whether to enable overshoot on the right side */
  overshootRight?: boolean
  /** Whether to close the swipeable when the swipeable is opened. i.e UX for repliable messages */
  closeOnOpen?: boolean
  /** Background color for left actions container */
  leftActionsBackgroundColor?: string
  /** Background color for right actions container */
  rightActionsBackgroundColor?: string
  /** Hit slop for left actions container. Accepts negative values */
  leftHitSlop?: number
  /** Hit slop for right actions container. Accepts negative values */
  rightHitSlop?: number

  children: React.ReactNode
}

export function Swipeable({
  renderLeftActions,
  renderRightActions,
  onLeftSwipe,
  onRightSwipe,
  leftThreshold,
  rightThreshold,
  overshootFriction = 1,
  dragOffsetFromLeftEdge,
  dragOffsetFromRightEdge,
  overshootLeft,
  overshootRight,
  closeOnOpen,
  leftHitSlop,
  rightHitSlop,
  children,
  leftActionsBackgroundColor,
  rightActionsBackgroundColor,
}: ISwipeableProps) {
  const swipeableRef = useRef<SwipeableMethods>(null)

  const swipeDirectionAV = useSharedValue<"left" | "right">("left")

  const onSwipeableWillOpen = useCallback(
    (direction: "left" | "right") => {
      // logger.debug("[Swipeable] onSwipeableWillOpen", { direction });
      if (direction === "left") {
        onLeftSwipe?.()
      } else {
        onRightSwipe?.()
      }

      if (closeOnOpen) {
        swipeableRef.current?.close()
      }
    },
    [onLeftSwipe, onRightSwipe, closeOnOpen],
  )

  const onSwipeableOpenStartDrag = useCallback(
    (direction: "left" | "right") => {
      // logger.debug("[Swipeable] onSwipeableWillBegin", { direction });
      swipeDirectionAV.value = direction
    },
    [swipeDirectionAV],
  )

  const renderLeftActionsCallback = useCallback(
    (progress: SharedValue<number>, drag: SharedValue<number>, swipeable: SwipeableMethods) => {
      return renderLeftActions?.({
        progressAnimatedValue: progress,
        dragAnimatedValue: drag,
        swipeable,
      })
    },
    [renderLeftActions],
  )

  const renderRightActionsCallback = useCallback(
    (progress: SharedValue<number>, drag: SharedValue<number>, swipeable: SwipeableMethods) => {
      return renderRightActions?.({
        progressAnimatedValue: progress,
        dragAnimatedValue: drag,
        swipeable,
      })
    },
    [renderRightActions],
  )

  /**
   * To make sure the background color of right/left actions container is updated when the swipe direction changes
   */
  const swipeableContainerStyle = useAnimatedStyle(() => {
    const backgroundColor =
      swipeDirectionAV.value === "left" ? leftActionsBackgroundColor : rightActionsBackgroundColor

    if (!backgroundColor) {
      return {}
    }

    return {
      backgroundColor,
    }
  })

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      /**
       * Rendering
       * */
      renderLeftActions={renderLeftActions ? renderLeftActionsCallback : undefined}
      renderRightActions={renderRightActions ? renderRightActionsCallback : undefined}
      containerStyle={swipeableContainerStyle}
      /**
       * Configuration
       * */
      hitSlop={{
        left: leftHitSlop,
        right: rightHitSlop,
      }}
      overshootFriction={overshootFriction}
      overshootRight={overshootRight}
      overshootLeft={overshootLeft}
      // If we don't have any panels to render, we set a huge offset to prevent swiping in that direction
      dragOffsetFromLeftEdge={renderLeftActions ? dragOffsetFromLeftEdge : 100000}
      // If we don't have any panels to render, we set a huge offset to prevent swiping in that direction
      dragOffsetFromRightEdge={renderRightActions ? dragOffsetFromRightEdge : 100000}
      leftThreshold={leftThreshold}
      rightThreshold={rightThreshold}
      /**
       * Events
       * */
      onSwipeableWillOpen={onSwipeableWillOpen}
      // Don't use this event because it has delay
      // onSwipeableClose={() => {
      //   // logger.debug("[Swipeable] onSwipeableClose");
      // }}
      // Don't use this event because it has delay, we prefer onSwipeableWillOpen
      // onSwipeableOpen={() => {
      //   // logger.debug("[Swipeable] onSwipeableOpen");
      // }}
      onSwipeableOpenStartDrag={onSwipeableOpenStartDrag}
    >
      {children}
    </ReanimatedSwipeable>
  )
}
