import { useAppTheme } from "@/theme/use-app-theme"

export function useConversationMessageStyles() {
  const { theme } = useAppTheme()

  const spaceBetweenMessagesInSeries = theme.spacing["4xs"]

  return {
    spaceBetweenMessagesInSeries,
    senderAvatarSize: theme.avatarSize.sm,
    spaceBetweenSenderAvatarAndMessage: theme.spacing.xxs,
    messageContainerSidePadding: theme.spacing.sm,
    spaceBetweenMessageFromDifferentUserOrType: theme.spacing.sm,
    spaceBetweenMessageAndSender: theme.spacing.xxxs,
    senderNameLeftMargin: theme.spacing.xs,
    spaceBetweenSeriesWithReactions: theme.spacing["3xs"] + spaceBetweenMessagesInSeries,
  }
}
