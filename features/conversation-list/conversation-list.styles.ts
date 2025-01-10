import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationListStyles() {
  const { theme } = useAppTheme();

  return {
    screenHorizontalPadding: theme.spacing.lg,
  };
}
