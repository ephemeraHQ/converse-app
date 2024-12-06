import { RemoteAttachmentImage } from "@/components/Chat/Attachment/remote-attachment-image";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { DecodedMessage, RemoteAttachmentCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";

type IMessageRemoteAttachmentProps = {
  message: DecodedMessage<[RemoteAttachmentCodec]>;
};

export const MessageRemoteAttachment = memo(function MessageRemoteAttachment({
  message,
}: IMessageRemoteAttachmentProps) {
  const { theme } = useAppTheme();

  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  return (
    <MessageLayout>
      <VStack
        // {...debugBorder("green")}
        style={{
          maxWidth: theme.layout.screen.width * 0.7,
        }}
      >
        <RemoteAttachmentImage
          messageId={message.id}
          remoteMessageContent={content}
          fitAspectRatio
        />
      </VStack>
    </MessageLayout>
  );
});
