import { VStack } from "@/design-system/VStack";
import { AttachmentRemoteImage } from "@/features/conversation/conversation-attachment/conversation-attachment-remote-image";
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user";
import { useAppTheme } from "@/theme/useAppTheme";
import { DecodedMessage, RemoteAttachmentCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";

type IMessageRemoteAttachmentProps = {
  message: DecodedMessage<RemoteAttachmentCodec>;
};

export const MessageRemoteAttachment = memo(function MessageRemoteAttachment({
  message,
}: IMessageRemoteAttachmentProps) {
  const { theme } = useAppTheme();

  const content = message.content();

  const fromMe = messageIsFromCurrentAccountInboxId({ message });

  if (typeof content === "string") {
    // TODO
    return null;
  }

  return (
    <VStack
      // {...debugBorder("green")}
      style={{
        maxWidth: theme.layout.screen.width * 0.7,
        alignSelf: fromMe ? "flex-end" : "flex-start",
      }}
    >
      <AttachmentRemoteImage
        messageId={message.id}
        remoteMessageContent={content}
        fitAspectRatio
      />
    </VStack>
  );
});
