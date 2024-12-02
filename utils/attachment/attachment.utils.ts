import { LocalAttachmentMetadata } from "@utils/attachment/types";
import RNFS from "react-native-fs";
import { getImageSize, isImageMimetype } from "../media";

export function getMessagesAttachmentsLocalFolderPath(messageId: string) {
  return `${RNFS.DocumentDirectoryPath}/messages/${messageId}`;
}

export function getMessageAttachmentLocalMetadataPath(messageId: string) {
  const messageFolder = getMessagesAttachmentsLocalFolderPath(messageId);
  return `${messageFolder}/attachment.json`;
}

export function getMessageAttachmentLocalPath(
  messageId: string,
  filename: string
) {
  const messageFolder = getMessagesAttachmentsLocalFolderPath(messageId);
  return `${messageFolder}/${filename}`;
}

export async function createFolderForMessage(messageId: string) {
  const messageFolder = getMessagesAttachmentsLocalFolderPath(messageId);
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
}

export async function saveLocalAttachmentMetaData(args: {
  messageId: string;
  filename: string;
  mimeType: string | undefined;
}) {
  const { messageId, filename, mimeType } = args;

  const attachmentPath = getMessageAttachmentLocalPath(messageId, filename);
  const attachmentJsonPath = getMessageAttachmentLocalMetadataPath(messageId);
  const isImage = isImageMimetype(mimeType);

  const imageSize = isImage
    ? await getImageSize(`file://${attachmentPath}`)
    : undefined;

  const attachmentMetaData: LocalAttachmentMetadata = {
    filename,
    mimeType,
    imageSize,
  };

  await RNFS.writeFile(
    attachmentJsonPath,
    JSON.stringify(attachmentMetaData),
    "utf8"
  );
}

export async function getLocalAttachmentMetaData(messageId: string) {
  const attachmentJsonPath = getMessageAttachmentLocalMetadataPath(messageId);
  const attachmentMetaData = await RNFS.readFile(attachmentJsonPath, "utf8");
  return JSON.parse(attachmentMetaData) as LocalAttachmentMetadata;
}
