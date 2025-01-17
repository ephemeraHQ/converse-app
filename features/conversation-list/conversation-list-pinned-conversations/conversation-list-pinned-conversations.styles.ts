import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationListPinnedConversationsStyles() {
  const { theme } = useAppTheme();

  return {
    avatarSize: theme.avatarSize["xxl"],
  } as const;
}
