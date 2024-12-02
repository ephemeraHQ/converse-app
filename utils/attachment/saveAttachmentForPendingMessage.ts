import RNFS from "react-native-fs";
import { moveFileAndReplace } from "../fileSystem";
import { getLocalAttachment } from "./handleAttachment";

export const saveAttachmentForPendingMessage = async (args: {
  pendingMessageId: string;
  filePath: string;
  fileName: string;
  mimeType: string | undefined;
}) => {
  const { pendingMessageId, filePath, fileName, mimeType } = args;
  const messageFolder = `${RNFS.DocumentDirectoryPath}/messages/${args.pendingMessageId}`;
  // Create folder
  await RNFS.mkdir(messageFolder, {
    NSURLIsExcludedFromBackupKey: true,
  });
  const attachmentPath = `${messageFolder}/${fileName}`;
  await moveFileAndReplace(filePath, attachmentPath);
  await getLocalAttachment(pendingMessageId, fileName, mimeType || undefined);
};
