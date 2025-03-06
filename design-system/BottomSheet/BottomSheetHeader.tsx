import { memo, useCallback } from "react"
import { useAppTheme } from "../../theme/use-app-theme"
import { HStack } from "../HStack"
import { IconButton } from "../IconButton/IconButton"
import { ITextProps, Text } from "../Text"
import { useBottomSheet } from "./BottomSheet.utils"

type IBottomSheetHeaderProps = {
  title?: string | React.ReactNode
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
      {typeof title === "string" ? <BottomSheetHeaderTitle>{title}</BottomSheetHeaderTitle> : title}
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

export const BottomSheetHeaderTitle = memo(function BottomSheetHeaderTitle(props: ITextProps) {
  return <Text preset="bigBold" {...props} />
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
