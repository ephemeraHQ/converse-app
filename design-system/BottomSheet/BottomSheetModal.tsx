import {
  BottomSheetHandleProps as GorhomBottomSheetHandleProps,
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetModalProps as GorhomBottomSheetModalProps,
  SNAP_POINT_TYPE,
} from "@gorhom/bottom-sheet"
import { BottomSheetModalMethods as GorhomBottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types"
import { forwardRef, memo, useCallback, useMemo } from "react"
import { Platform } from "react-native"
import { FullWindowOverlay } from "react-native-screens"
import { useAppTheme } from "../../theme/use-app-theme"
import { BottomSheetBackdropOpacity } from "./BottomSheetBackdropOpacity"
import { BottomSheetHandleBar } from "./BottomSheetHandleBar"

export type IBottomSheetModalProps = GorhomBottomSheetModalProps & {
  absoluteHandleBar?: boolean
  onClose?: () => void
}

export const BottomSheetModal = memo(
  forwardRef<GorhomBottomSheetModalMethods, IBottomSheetModalProps>(
    function BottomSheetModal(props, ref) {
      const { absoluteHandleBar = true, backgroundStyle, onClose, onChange, ...rest } = props

      const { theme } = useAppTheme()

      // https://github.com/gorhom/react-native-bottom-sheet/issues/1644#issuecomment-1949019839

      const renderContainerComponent = useCallback((props: any) => {
        return <FullWindowOverlay {...props} />
      }, [])

      const renderHandleComponent = useCallback(
        (props: GorhomBottomSheetHandleProps) => {
          return <BottomSheetHandleBar isAbsolute={absoluteHandleBar} {...props} />
        },
        [absoluteHandleBar],
      )

      const combinedBackgroundStyle = useMemo(
        () => [
          {
            backgroundColor: theme.colors.background.raised,
          },
          backgroundStyle,
        ],
        [theme.colors.background.raised, backgroundStyle],
      )

      const handleOnChange = useCallback(
        (index: number, position: number, type: SNAP_POINT_TYPE) => {
          if (index === -1 && onClose) {
            onClose()
          }

          if (onChange) {
            onChange(index, position, type)
          }
        },
        [onClose, onChange],
      )

      return (
        <GorhomBottomSheetModal
          ref={ref}
          containerComponent={Platform.OS === "ios" ? renderContainerComponent : undefined}
          onChange={handleOnChange}
          enableDynamicSizing={false} // By default we don't want enable dynamic sizing
          backdropComponent={BottomSheetBackdropOpacity}
          handleComponent={renderHandleComponent}
          backgroundStyle={combinedBackgroundStyle}
          {...rest}
        />
      )
    },
  ),
)
