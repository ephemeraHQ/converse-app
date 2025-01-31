import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationMessageContextMenuStyles() {
  const { theme } = useAppTheme();

  return {
    verticalSpaceBetweenSections: theme.spacing.xxs,
  };
}
