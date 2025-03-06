import { useAppTheme } from "@/theme/use-app-theme"

export function useConversationListPinnedConversationsStyles() {
  const { theme } = useAppTheme()

  return {
    avatarSize: theme.avatarSize["xxl"],
  } as const
}
