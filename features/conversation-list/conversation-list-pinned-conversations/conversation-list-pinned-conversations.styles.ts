import { useConversationListStyles } from "@/features/conversation-list/conversation-list.styles";
import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationListPinnedConversationsStyles() {
  const { theme } = useAppTheme();

  const { screenHorizontalPadding } = useConversationListStyles();

  return {
    avatarSize: theme.layout.grid.getColumnWidth({
      totalColumns: 3,
      horizontalPadding: screenHorizontalPadding,
      gap: theme.spacing.sm,
    }),
  } as const;
}
