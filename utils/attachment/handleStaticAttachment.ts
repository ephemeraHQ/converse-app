import RNFS from "react-native-fs";

import { handleAttachment } from "./handleAttachment";
import { SerializedAttachmentContent } from "./types";

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
