import {
  getMessageAttachmentLocalPath,
  getMessagesAttachmentsLocalFolderPath,
} from "@utils/attachment/attachment.utils";
import RNFS from "react-native-fs";
import { getLocalAttachment } from "./handleAttachment";
import { SerializedAttachmentContent } from "./types";

// TOD: Rename to something like "writeAttachmentToDisk"?
export const handleStaticAttachment = async (
  messageId: string,
  staticAttachment: SerializedAttachmentContent
) => {
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
};
