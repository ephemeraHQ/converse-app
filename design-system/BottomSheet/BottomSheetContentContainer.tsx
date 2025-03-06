import { BottomSheetView as GorhomBottomSheetView } from "@gorhom/bottom-sheet"
import { BottomSheetViewProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetView/types"
import { memo } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// Note: Don't use it when you use a BottomSheetFlatList. It seems to break the list scrolling.

type IBottomSheetContentContainerProps = BottomSheetViewProps & {
  withBottomInsets?: boolean
}

export const BottomSheetContentContainer = memo(function BottomSheetContentContainer(
  props: IBottomSheetContentContainerProps,
) {
  const { style, withBottomInsets, ...rest } = props
  const { bottom } = useSafeAreaInsets()

  return (
    <GorhomBottomSheetView
      style={[
        style,
        withBottomInsets && {
          paddingBottom: bottom,
        },
      ]}
      {...rest}
    />
  )
})
