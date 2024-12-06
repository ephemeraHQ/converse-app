import { RemoteAttachmentImage } from "@/components/Chat/Attachment/remote-attachment-image";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import { DecodedMessage, RemoteAttachmentCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";

type IMessageRemoteAttachmentProps = {
  message: DecodedMessage<RemoteAttachmentCodec>;
};

export const MessageRemoteAttachment = memo(function MessageRemoteAttachment({
  message,
}: IMessageRemoteAttachmentProps) {
  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  return (
    <MessageLayout>
      <RemoteAttachmentImage
        messageId={message.id}
        remoteMessageContent={content}
        fitAspectRatio
      />
    </MessageLayout>
  );
});
