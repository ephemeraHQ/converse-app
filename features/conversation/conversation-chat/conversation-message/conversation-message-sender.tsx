import { Text } from "@design-system/Text"
import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { Pressable } from "@/design-system/Pressable"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"

type IConversationMessageSenderProps = {
  inboxId: IXmtpInboxId
}

export function ConversationMessageSender(args: IConversationMessageSenderProps) {
  const { inboxId } = args

  const { theme } = useAppTheme()

  const { displayName, isLoading } = usePreferredDisplayInfo({
    inboxId,
  })

  const router = useRouter()

  if (isLoading) {
    return null
  }

  return (
    <Pressable
      hitSlop={theme.spacing.xxxs}
      onPress={() => {
        router.push("Profile", {
          inboxId,
        })
      }}
    >
      <Text preset="smaller" color="secondary">
        {displayName}
      </Text>
    </Pressable>
  )
}
