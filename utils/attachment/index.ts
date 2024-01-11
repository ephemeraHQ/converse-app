import {
  DecryptedLocalAttachment,
  EncryptedLocalAttachment,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import mime from "mime";
import RNFS from "react-native-fs";
import RNFetchBlob from "rn-fetch-blob";

import { getPresignedUriForUpload } from "../api";
import { moveFileAndReplace } from "../fileSystem";
import { getImageSize, isImageMimetype } from "../media";

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

export const handleStaticAttachment = async (
  messageId: string,
  staticAttachment: SerializedAttachmentContent
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  const attachmentPath = `${messageFolder}/${staticAttachment.filename}`;
  // Let's cache the file and decoded information
  await RNFS.writeFile(attachmentPath, staticAttachment.data, "base64");
  return handleAttachment(
    messageId,
    staticAttachment.filename,
    staticAttachment.mimeType
  );
};

export const handleDecryptedRemoteAttachment = async (
  messageId: string,
  localAttachment: DecryptedLocalAttachment
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  let filename =
    localAttachment.filename || localAttachment.fileUri.split("/").slice(-1)[0];
  // Add extension for the mimetype if necessary
  if (localAttachment.mimeType) {
    const extension = mime.getExtension(localAttachment.mimeType);
    if (extension && !filename.toLowerCase().endsWith(`.${extension}`)) {
      filename = `${filename}.${extension}`;
    }
  }
  const attachmentPath = `${messageFolder}/${filename}`;
  let fileUri = localAttachment.fileUri;
  if (fileUri.startsWith("file:///")) {
    fileUri = fileUri.slice(7);
  } else if (fileUri.startsWith("file://")) {
    fileUri = fileUri.slice(6);
  } else if (fileUri.startsWith("file:/")) {
    fileUri = fileUri.slice(5);
  }

  // Let's cache the file and decoded information
  await moveFileAndReplace(fileUri, attachmentPath);
  return handleAttachment(messageId, filename, localAttachment.mimeType);
};

const handleAttachment = async (
  messageId: string,
  filename: string,
  mimeType?: string
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
  const attachmentPath = `${messageFolder}/${filename}`;
  const attachmentJsonPath = `${messageFolder}/attachment.json`;
  const isImage = isImageMimetype(mimeType);
  const imageSize = isImage
    ? await getImageSize(`file://${attachmentPath}`)
    : undefined;
  await RNFS.writeFile(
    attachmentJsonPath,
    JSON.stringify({
      filename,
      mimeType,
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
    filename,
    mimeType: mimeType || "",
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

export const uploadRemoteAttachment = async (
  account: string,
  attachment: EncryptedLocalAttachment
): Promise<RemoteAttachmentContent> => {
  const { url } = await getPresignedUriForUpload(account);
  await RNFetchBlob.fetch(
    "PUT",
    url,
    {
      "content-type": "application/octet-stream",
      "x-amz-acl": "public-read",
    },
    RNFetchBlob.wrap(attachment.encryptedLocalFileUri.replace("file:///", "/"))
  );

  const fileURL = new URL(url);
  const publicURL = fileURL.origin + fileURL.pathname;

  return {
    scheme: "https://",
    url: publicURL,
    ...attachment.metadata,
  };
};

export const saveAttachmentForPendingMessage = async (
  pendingMessageId: string,
  filePath: string,
  fileName: string,
  mimeType: string | null
) => {
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${pendingMessageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  const attachmentPath = `${messageFolder}/${fileName}`;
  await moveFileAndReplace(filePath, attachmentPath);
  await handleAttachment(pendingMessageId, fileName, mimeType || undefined);
};
