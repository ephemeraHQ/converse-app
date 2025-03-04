import { memo, useCallback } from "react"
import { useAppTheme } from "../../theme/use-app-theme"
import { HStack } from "../HStack"
import { IconButton } from "../IconButton/IconButton"
import { Text } from "../Text"
import { useBottomSheet } from "./BottomSheet.utils"

type IBottomSheetHeaderProps = {
  title?: string
  onClose?: () => void
}

// Dumb component that doesn't use useBottomSheet
export const BottomSheetHeaderBase = memo(function BottomSheetHeaderBase(
  props: IBottomSheetHeaderProps,
) {
  const { title, onClose } = props
  const { theme } = useAppTheme()

  return (
    <HStack
      style={{
        // ...debugBorder(),
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing.lg,
      }}
    >
      {!!title && <Text preset="bigBold">{title}</Text>}
      {onClose && (
        <IconButton
          action="primary"
          variant="subtle"
          size="md"
          iconName="xmark"
          onPress={onClose}
          style={{
            borderRadius: theme.borderRadius.md,
          }}
        />
      )}
    </HStack>
  )
})

// Smart component that uses useBottomSheet
export const BottomSheetHeader = memo(function BottomSheetHeader(
  props: IBottomSheetHeaderProps & { hasClose?: boolean },
) {
  const { onClose, hasClose = true } = props
  const { close } = useBottomSheet()

  const handleClose = useCallback(() => {
    if (!hasClose) {
      return undefined
    }
    if (onClose) {
      onClose()
    } else {
      close()
    }
  }, [close, hasClose, onClose])

  return <BottomSheetHeaderBase {...props} onClose={handleClose} />
})
