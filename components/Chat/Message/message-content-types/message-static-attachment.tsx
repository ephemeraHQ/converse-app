import { AttachmentContainer } from "@/components/Chat/Attachment/attachment-container";
import { AttachmentLoading } from "@/components/Chat/Attachment/attachment-loading";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import { Text } from "@/design-system/Text";
import { getLocalAttachment } from "@/utils/attachment/handleAttachment";
import { useQuery } from "@tanstack/react-query";
import {
  getMessageAttachmentLocalPath,
  getMessagesAttachmentsLocalFolderPath,
} from "@utils/attachment/attachment.utils";
import {
  DecodedMessage,
  StaticAttachmentCodec,
  StaticAttachmentContent,
} from "@xmtp/react-native-sdk";
import { Image } from "expo-image";
import { memo } from "react";
import RNFS from "react-native-fs";

type IMessageStaticAttachmentProps = {
  message: DecodedMessage<[StaticAttachmentCodec]>;
};

export const MessageStaticAttachment = memo(function MessageStaticAttachment({
  message,
}: IMessageStaticAttachmentProps) {
  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  return (
    <MessageLayout>
      <Content messageId={message.id} staticAttachment={content} />
    </MessageLayout>
  );
});

const Content = memo(function Content(props: {
  messageId: string;
  staticAttachment: StaticAttachmentContent;
}) {
  const { messageId, staticAttachment } = props;

  const {
    data: attachment,
    isLoading: attachmentLoading,
    error: attachmentError,
  } = useQuery({
    queryKey: ["attachment", messageId],
    queryFn: async () => {
      const messageFolder = getMessagesAttachmentsLocalFolderPath(messageId);

      // Create folder
      await RNFS.mkdir(messageFolder, {
        NSURLIsExcludedFromBackupKey: true,
      });

      const attachmentPath = getMessageAttachmentLocalPath(
        messageId,
        staticAttachment.filename
      );

      await RNFS.writeFile(attachmentPath, staticAttachment.data, "base64");

      return getLocalAttachment(
        messageId,
        staticAttachment.filename,
        staticAttachment.mimeType
      );
    },
  });

  if (!attachment && attachmentLoading) {
    return (
      <AttachmentContainer>
        <AttachmentLoading />
      </AttachmentContainer>
    );
  }

  if (attachmentError || !attachment) {
    return (
      <AttachmentContainer>
        <Text>Couldn't find attachment</Text>
      </AttachmentContainer>
    );
  }

  const aspectRatio = attachment.imageSize
    ? attachment.imageSize.width / attachment.imageSize.height
    : undefined;

  return (
    <AttachmentContainer style={{ aspectRatio }}>
      <Image
        source={{ uri: attachment.mediaURL }}
        contentFit="cover"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </AttachmentContainer>
  );
});
