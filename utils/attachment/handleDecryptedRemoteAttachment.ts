import { moveFileAndReplace } from "@utils/fileSystem";
import { DecryptedLocalAttachment } from "@xmtp/react-native-sdk";
import mime from "mime";
import { handleAttachment } from "./handleAttachment";
import RNFS from "react-native-fs";

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
