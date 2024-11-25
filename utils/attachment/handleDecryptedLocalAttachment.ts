import {
  getMessageAttachmentLocalPath,
  getMessagesAttachmentsLocalFolderPath,
} from "@utils/attachment/attachment.utils";
import { moveFileAndReplace } from "@utils/fileSystem";
import { DecryptedLocalAttachment } from "@xmtp/react-native-sdk";
import mime from "mime";
import RNFS from "react-native-fs";
import { getLocalAttachment } from "./handleAttachment";

export const handleDecryptedLocalAttachment = async (args: {
  messageId: string;
  decryptedLocalAttachment: DecryptedLocalAttachment;
}) => {
  const { messageId, decryptedLocalAttachment } = args;

  const messageFolder = getMessagesAttachmentsLocalFolderPath(messageId);

  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });

  let filename =
    decryptedLocalAttachment.filename ||
    decryptedLocalAttachment.fileUri.split("/").slice(-1)[0];

  // Add proper file extension based on mimetype if missing
  if (decryptedLocalAttachment.mimeType) {
    const extension = mime.getExtension(decryptedLocalAttachment.mimeType);
    const hasExtension = filename.includes(".");
    if (extension && !hasExtension) {
      filename = `${filename}.${extension}`;
    }
  }

  // Construct full path for storing the attachment
  const attachmentPath = getMessageAttachmentLocalPath(messageId, filename);

  // Normalize file URI by removing file:// prefixes
  let fileUri = decryptedLocalAttachment.fileUri;
  if (fileUri.startsWith("file:///")) {
    fileUri = fileUri.slice(7);
  } else if (fileUri.startsWith("file://")) {
    fileUri = fileUri.slice(6);
  } else if (fileUri.startsWith("file:/")) {
    fileUri = fileUri.slice(5);
  }

  // Move file to permanent storage location
  await moveFileAndReplace(fileUri, attachmentPath);

  // Process and return attachment information
  return getLocalAttachment(
    messageId,
    filename,
    decryptedLocalAttachment.mimeType
  );
};
