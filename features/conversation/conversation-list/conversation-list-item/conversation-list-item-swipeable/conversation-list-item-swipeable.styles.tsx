import { useAppTheme } from "@/theme/use-app-theme"

export function useConversationListItemSwipeableStyles() {
  const { theme } = useAppTheme()
  return {
    swipeThreshold: theme.spacing["6xl"],
  }
}
