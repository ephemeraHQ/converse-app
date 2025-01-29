import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationListStyles() {
  const { theme } = useAppTheme();

  return {
    screenHorizontalPadding: theme.spacing.lg,
    listItemPaddingVertical: theme.spacing.xs,
  };
}
