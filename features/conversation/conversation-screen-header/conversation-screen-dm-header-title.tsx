import { ConversationTopic } from "@xmtp/react-native-sdk"
import { useCallback } from "react"
import { Avatar } from "@/components/avatar"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { ConversationHeaderTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-header-title"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useRouter } from "@/navigation/use-navigation"
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query"
import { useAppTheme } from "@/theme/use-app-theme"
import { copyToClipboard } from "@/utils/clipboard"
import { shortAddress } from "@/utils/strings/shortAddress"

type DmConversationTitleProps = {
  topic: ConversationTopic
}

export const DmConversationTitle = ({ topic }: DmConversationTitleProps) => {
  const account = useCurrentSenderEthAddress()!
  const navigation = useRouter()
  const { theme } = useAppTheme()

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account,
    topic,
    caller: "DmConversationTitle",
  })

  const { displayName, avatarUrl, isLoading } = usePreferredDisplayInfo({
    inboxId: peerInboxId!,
  })

  const onPress = useCallback(() => {
    if (peerInboxId) {
      navigation.push("Profile", { inboxId: peerInboxId })
    }
  }, [navigation, peerInboxId])

  const onLongPress = useCallback(() => {
    copyToClipboard(JSON.stringify(topic))
  }, [topic])

  if (isLoading) {
    return null
  }

  return (
    <ConversationHeaderTitle
      title={displayName}
      onLongPress={onLongPress}
      onPress={onPress}
      avatarComponent={
        <Avatar
          uri={avatarUrl}
          sizeNumber={theme.avatarSize.md}
          name={displayName}
        />
      }
    />
  )
}
