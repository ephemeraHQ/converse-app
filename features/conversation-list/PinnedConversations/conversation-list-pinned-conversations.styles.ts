import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationListPinnedConversationsStyles() {
  const { theme } = useAppTheme();

  return {
    avatarSize: theme.layout.grid.getColumnWidth({
      totalColumns: 3,
      horizontalPadding: theme.layout.screenPadding.horizontal,
      gap: theme.spacing.sm,
    }),
  } as const;
}
