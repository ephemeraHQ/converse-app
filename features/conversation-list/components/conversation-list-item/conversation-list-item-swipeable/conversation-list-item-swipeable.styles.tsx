import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationListItemSwipeableStyles() {
  const { theme } = useAppTheme();
  return {
    swipeThreshold: theme.spacing["5xl"],
  };
}
