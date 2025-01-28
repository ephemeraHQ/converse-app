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
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { memo } from "react";

export const ConversationMessage = memo(
  function ConversationMessage(props: {
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

    return null;
  },
  // For now it's okay. For performance. A message shouldn't change
  (prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id;
  }
);
