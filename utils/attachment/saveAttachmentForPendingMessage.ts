import RNFS from "react-native-fs";

import { moveFileAndReplace } from "../fileSystem";
import { handleAttachment } from "./handleAttachment";

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
