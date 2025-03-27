import { useAppTheme } from "@/theme/use-app-theme"

export function useConversationMessageContextMenuStyles() {
  const { theme } = useAppTheme()

  return {
    verticalSpaceBetweenSections: theme.spacing.xxs,
  }
}
