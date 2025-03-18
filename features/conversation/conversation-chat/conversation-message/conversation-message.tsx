import { memo } from "react"
import { MessageMultiRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-message-multi-remote-attachments"
import { ConversationMessageRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-message-remote-attachment"
import { ConversationMessageStaticAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-message-static-attachment"
import { ConversationMessageGroupUpdate } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-group-update"
import { MessageReply } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reply"
import { MessageSimpleText } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-simple-text"
import {
  isGroupUpdatedMessage,
  isMultiRemoteAttachmentMessage,
  isReactionMessage,
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTextMessage,
} from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { IConversationMessage } from "./conversation-message.types"

export const ConversationMessage = memo(function ConversationMessage(props: {
  message: IConversationMessage
}) {
  const { message } = props

  if (isTextMessage(message)) {
    return <MessageSimpleText message={message} />
  }

  if (isGroupUpdatedMessage(message)) {
    return <ConversationMessageGroupUpdate message={message} />
  }

  if (isReplyMessage(message)) {
    return <MessageReply message={message} />
  }

  if (isRemoteAttachmentMessage(message)) {
    return <ConversationMessageRemoteAttachment message={message} />
  }

  if (isStaticAttachmentMessage(message)) {
    return <ConversationMessageStaticAttachment message={message} />
  }

  if (isReactionMessage(message)) {
    // Handle in message
    return null
  }

  if (isReadReceiptMessage(message)) {
    // Not handled here
    return null
  }

  if (isMultiRemoteAttachmentMessage(message)) {
    return <MessageMultiRemoteAttachment message={message} />
  }

  const _ensureNever: never = message

  return null
})
