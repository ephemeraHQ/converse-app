import { RemoteAttachment } from "@xmtp/content-type-remote-attachment";
import RNFS from "react-native-fs";

import { getImageSize, isImageMimetype } from "./media";

export type SerializedAttachmentContent = {
  filename: string;
  mimeType: string;
  data: string;
};

export type SerializedRemoteAttachmentContent = {
  nonce: string;
  salt: string;
  secret: string;
  url: string;
  contentDigest: string;
  scheme: string;
  contentLength: number;
  filename: string;
};

export const deserializeRemoteAttachmentContent = (
  serializedRemoteAttachment: string
): RemoteAttachment => {
  const parsedAttachment: SerializedRemoteAttachmentContent = JSON.parse(
    serializedRemoteAttachment
  );
  return {
    ...parsedAttachment,
    nonce: Buffer.from(parsedAttachment.nonce, "base64"),
    salt: Buffer.from(parsedAttachment.salt, "base64"),
    secret: Buffer.from(parsedAttachment.secret, "base64"),
  };
};

export const isAttachmentMessage = (contentType?: string) =>
  contentType
    ? contentType.startsWith("xmtp.org/attachment:") ||
      contentType.startsWith("xmtp.org/remoteStaticAttachment:")
    : false;

export const handleAttachmentContent = async (
  messageId: string,
  attachmentContent: SerializedAttachmentContent
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  const attachmentJsonPath = `${messageFolder}/attachment.json`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  const attachmentPath = `${messageFolder}/${attachmentContent.filename}`;
  const isImage = isImageMimetype(attachmentContent.mimeType);
  // Let's cache the file and decoded information
  await RNFS.writeFile(attachmentPath, attachmentContent.data, "base64");
  const imageSize = isImage
    ? await getImageSize(`file://${attachmentPath}`)
    : undefined;
  await RNFS.writeFile(
    attachmentJsonPath,
    JSON.stringify({
      filename: attachmentContent.filename,
      mimeType: attachmentContent.mimeType,
      imageSize,
    }),
    "utf8"
  );

  return {
    mediaType: isImage
      ? "IMAGE"
      : ("UNSUPPORTED" as "IMAGE" | "UNSUPPORTED" | undefined),
    imageSize,
    contentLength: 0,
    mediaURL: attachmentPath,
    filename: attachmentContent.filename,
    mimeType: attachmentContent.mimeType,
  };
};

export const getLocalAttachment = async (messageId: string) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  const attachmentJsonPath = `${messageFolder}/attachment.json`;
  const attachmentExists = await RNFS.exists(attachmentJsonPath);
  if (attachmentExists) {
    try {
      const attachmentJsonContent = await RNFS.readFile(
        attachmentJsonPath,
        "utf8"
      );
      const messageAttachmentData = JSON.parse(attachmentJsonContent);
      const supportedMediaType = isImageMimetype(
        messageAttachmentData.mimeType
      );
      const attachmentPath = `${messageFolder}/${messageAttachmentData.filename}`;
      const fileExists = await RNFS.exists(attachmentPath);
      if (fileExists) {
        // If we have the file locally let's display
        // it or have a link
        return {
          mediaType: (supportedMediaType ? "IMAGE" : "UNSUPPORTED") as
            | "IMAGE"
            | "UNSUPPORTED"
            | undefined,
          mimeType: messageAttachmentData.mimeType,
          imageSize: messageAttachmentData.imageSize,
          mediaURL: attachmentPath,
          contentLength: 0,
          filename: messageAttachmentData.filename,
        };
      }
    } catch (e) {
      console.log(e);
    }
  }
};
