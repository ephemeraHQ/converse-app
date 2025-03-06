import { memo } from "react"
import { MessageChatGroupUpdate } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-content-types/conversation-message-chat-group-update"
import { MessageRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-content-types/conversation-message-remote-attachment"
import { MessageReply } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-content-types/conversation-message-reply"
import { MessageSimpleText } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-content-types/conversation-message-simple-text"
import { MessageStaticAttachment } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-content-types/conversation-message-static-attachment"
import {
  isGroupUpdatedMessage,
  isReactionMessage,
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTextMessage,
} from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message.utils"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"

export const ConversationMessage = memo(
  function ConversationMessage(props: { message: IXmtpDecodedMessage }) {
    const { message } = props

    if (isTextMessage(message)) {
      return <MessageSimpleText message={message} />
    }

    if (isGroupUpdatedMessage(message)) {
      return <MessageChatGroupUpdate message={message} />
    }

    if (isReplyMessage(message)) {
      return <MessageReply message={message} />
    }

    if (isRemoteAttachmentMessage(message)) {
      return <MessageRemoteAttachment message={message} />
    }

    if (isStaticAttachmentMessage(message)) {
      return <MessageStaticAttachment message={message} />
    }

    if (isReactionMessage(message)) {
      // Handle in message
      return null
    }

    if (isReadReceiptMessage(message)) {
      // Not handled here
      return null
    }

    const _ensureNever = message

    return null
  },
  // For now it's okay. For performance. A message shouldn't change
  (prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id
  },
)
