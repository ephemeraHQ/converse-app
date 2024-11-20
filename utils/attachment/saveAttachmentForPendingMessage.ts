import RNFS from "react-native-fs";

import { moveFileAndReplace } from "../fileSystem";
import { handleAttachment } from "./handleAttachment";
import { Nullable } from "../../types/general";

export const saveAttachmentForPendingMessage = async (args: {
  pendingMessageId: string;
  filePath: string;
  fileName: string;
  mimeType: Nullable<string>;
}) => {
  const { pendingMessageId, filePath, fileName, mimeType } = args;
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${args.pendingMessageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  const attachmentPath = `${messageFolder}/${fileName}`;
  await moveFileAndReplace(filePath, attachmentPath);
  await handleAttachment(pendingMessageId, fileName, mimeType || undefined);
};
