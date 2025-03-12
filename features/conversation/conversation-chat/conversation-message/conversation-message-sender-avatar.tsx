import { useCallback } from "react"
import { Avatar } from "@/components/avatar"
import { Pressable } from "@/design-system/Pressable"
import { useConversationMessageStyles } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.styles"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"

type IConversationSenderAvatarProps = {
  inboxId: IXmtpInboxId
}

export function ConversationSenderAvatar({ inboxId }: IConversationSenderAvatarProps) {
  const { theme } = useAppTheme()
  const { senderAvatarSize } = useConversationMessageStyles()
  const { displayName, avatarUrl } = usePreferredDisplayInfo({ inboxId })

  const router = useRouter()

  const openProfile = useCallback(() => {
    router.push("Profile", { inboxId })
  }, [inboxId, router])

  return (
    <Pressable onPress={openProfile} hitSlop={theme.spacing.xxxs}>
      <Avatar sizeNumber={senderAvatarSize} uri={avatarUrl} name={displayName ?? ""} />
    </Pressable>
  )
}
