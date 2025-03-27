import {
  BottomSheetHandle as GorhomBottomSheetHandle,
  BottomSheetHandleProps as GorhomBottomSheetHandleProps,
} from "@gorhom/bottom-sheet"
import { memo } from "react"
import { useAppTheme } from "../../theme/use-app-theme"

export const BottomSheetHandleBar = memo(function BottomSheetHandleBar(
  props: GorhomBottomSheetHandleProps & {
    isAbsolute?: boolean
  },
) {
  const { isAbsolute, animatedIndex, animatedPosition } = props

  const { theme } = useAppTheme()

  return (
    <GorhomBottomSheetHandle
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      style={{
        // ...debugBorder(),
        paddingTop: theme.spacing.xxs,
        ...(isAbsolute && { position: "absolute", left: 0, right: 0 }),
      }}
      indicatorStyle={{
        backgroundColor: theme.colors.fill.tertiary,
        height: theme.spacing.xxxs,
        width: theme.spacing.xl,
      }}
    />
  )
})
