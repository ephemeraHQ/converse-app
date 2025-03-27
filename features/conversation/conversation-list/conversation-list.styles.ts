import { useAppTheme } from "@/theme/use-app-theme"

export function useConversationListStyles() {
  const { theme } = useAppTheme()

  return {
    screenHorizontalPadding: theme.spacing.lg,
    listItemPaddingVertical: theme.spacing.xs,
  }
}
