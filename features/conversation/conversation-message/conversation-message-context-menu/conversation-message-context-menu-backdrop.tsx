import { memo } from "react"
import { TouchableWithoutFeedback } from "react-native"
import { BlurView } from "@/design-system/BlurView"

export const MessageContextMenuBackdrop = memo(function MessageContextMenuBackdrop({
  children,
  handlePressBackdrop,
}: {
  children: React.ReactNode
  handlePressBackdrop: () => void
}) {
  return (
    <BlurView isAbsolute tint="dark">
      <TouchableWithoutFeedback onPress={handlePressBackdrop}>{children}</TouchableWithoutFeedback>
    </BlurView>
  )
})
