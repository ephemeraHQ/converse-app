import { useAppTheme } from "@/theme/useAppTheme";

export function useConversationMessageStyles() {
  const { theme } = useAppTheme();

  return {
    senderAvatarSize: theme.avatarSize.sm,
    spaceBetweenSenderAvatarAndMessage: theme.spacing.xxs,
    messageContainerSidePadding: theme.spacing.sm,
    spaceBetweenMessageFromDifferentUserOrType: theme.spacing.sm,
    spaceBetweenMessagesInSeries: theme.spacing["4xs"],
    spaceBetweenMessageAndSender: theme.spacing.xxxs,
    senderNameLeftMargin: theme.spacing.xs,
    spaceBetweenSeriesWithReactions:
      theme.spacing["3xs"] + theme.spacing["4xs"],
  };
}
