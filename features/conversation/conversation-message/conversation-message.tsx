import { MessageChatGroupUpdate } from "@/features/conversation/conversation-message/conversation-message-content-types/conversation-message-chat-group-update";
import { MessageRemoteAttachment } from "@/features/conversation/conversation-message/conversation-message-content-types/conversation-message-remote-attachment";
import { MessageReply } from "@/features/conversation/conversation-message/conversation-message-content-types/conversation-message-reply";
import { MessageSimpleText } from "@/features/conversation/conversation-message/conversation-message-content-types/conversation-message-simple-text";
import { MessageStaticAttachment } from "@/features/conversation/conversation-message/conversation-message-content-types/conversation-message-static-attachment";
import {
  isCoinbasePaymentMessage,
  isGroupUpdatedMessage,
  isReactionMessage,
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTextMessage,
  isTransactionReferenceMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { captureError } from "@/utils/capture-error";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client";
import { memo } from "react";

export const ConversationMessage = memo(function ConversationMessage(props: {
  message: DecodedMessageWithCodecsType;
}) {
  const { message } = props;

  if (isTextMessage(message)) {
    return <MessageSimpleText message={message} />;
  }

  if (isGroupUpdatedMessage(message)) {
    return <MessageChatGroupUpdate message={message} />;
  }

  if (isReplyMessage(message)) {
    return <MessageReply message={message} />;
  }

  if (isRemoteAttachmentMessage(message)) {
    return <MessageRemoteAttachment message={message} />;
  }

  if (isStaticAttachmentMessage(message)) {
    return <MessageStaticAttachment message={message} />;
  }

  if (isReactionMessage(message)) {
    // Handle in message
    return null;
  }

  if (isReadReceiptMessage(message)) {
    // TODO
    return null;
  }

  if (isTransactionReferenceMessage(message)) {
    // TODO
    return null;
  }

  if (isCoinbasePaymentMessage(message)) {
    // TODO
    return null;
  }

  const _ensureNever = message;

  captureError(new Error(`Unknown message type ${message.contentTypeId}`));

  return null;
});
