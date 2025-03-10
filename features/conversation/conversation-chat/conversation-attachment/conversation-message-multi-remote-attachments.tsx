import { DecodedMessage, MultiRemoteAttachmentCodec } from "@xmtp/react-native-sdk"
import { memo } from "react"
import { VStack } from "@/design-system/VStack"
import { AttachmentRemoteImage } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachment-remote-image"
import { ConversationMessageGestures } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-gestures"
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user"
import { useAppTheme } from "@/theme/use-app-theme"

type IMessageMultiRemoteAttachmentProps = {
  message: DecodedMessage<MultiRemoteAttachmentCodec>
}

export const MessageMultiRemoteAttachment = memo(function MessageMultiRemoteAttachment({
  message,
}: IMessageMultiRemoteAttachmentProps) {
  const { theme } = useAppTheme()

  const content = message.content()

  const fromMe = messageIsFromCurrentAccountInboxId({ message })

  if (typeof content === "string") {
    // TODO
    return null
  }

  return (
    <VStack
      // {...debugBorder("green")}
      style={{
        maxWidth: theme.layout.screen.width * 0.7,
        alignSelf: fromMe ? "flex-end" : "flex-start",
      }}
    >
      <ConversationMessageGestures>
        {content.attachments.map((attachment) => (
          <AttachmentRemoteImage
            key={attachment.url}
            messageId={message.id}
            remoteMessageContent={attachment}
            fitAspectRatio
          />
        ))}
      </ConversationMessageGestures>
    </VStack>
  )
})
