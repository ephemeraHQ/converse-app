import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationMessageStyles() {
  const { theme } = useAppTheme();

  return {
    senderAvatarSize: theme.avatarSize.sm,
    spaceBetweenSenderAvatarAndMessage: theme.spacing.xxs,
    messageContainerSidePadding: theme.spacing.sm,
  };
}
