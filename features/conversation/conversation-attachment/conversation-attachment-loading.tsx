import { memo } from "react"
import { ActivityIndicator } from "@/design-system/activity-indicator"
import { useAppTheme } from "@/theme/use-app-theme"

export const AttachmentLoading = memo(function AttachmentLoading() {
  const { theme } = useAppTheme()
  return <ActivityIndicator color={theme.colors.text.inverted.primary} />
})
