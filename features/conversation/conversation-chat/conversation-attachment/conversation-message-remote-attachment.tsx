import { memo } from "react"
import { VStack } from "@/design-system/VStack"
import { AttachmentRemoteImage } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachment-remote-image"
import { ConversationMessageGestures } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-gestures"
import { IConversationMessageRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { messageIsFromCurrentSenderInboxId } from "@/features/conversation/utils/message-is-from-current-user"
import { useAppTheme } from "@/theme/use-app-theme"

type IMessageRemoteAttachmentProps = {
  message: IConversationMessageRemoteAttachment
}

export const ConversationMessageRemoteAttachment = memo(
  function ConversationMessageRemoteAttachment({ message }: IMessageRemoteAttachmentProps) {
    const { theme } = useAppTheme()

    const content = message.content

    const fromMe = messageIsFromCurrentSenderInboxId({ message })

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
          <AttachmentRemoteImage
            xmtpMessageId={message.xmtpId}
            remoteMessageContent={content}
            fitAspectRatio
          />
        </ConversationMessageGestures>
      </VStack>
    )
  },
)
