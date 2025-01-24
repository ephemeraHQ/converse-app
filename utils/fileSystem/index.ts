import { getDbDirectory } from "@data/db";
import logger from "@utils/logger";
import path from "path";
import RNFS from "react-native-fs";
import { v4 as uuidv4 } from "uuid";

export const moveFileAndReplace = async (
  filePath: string,
  destPath: string
) => {
  const [filePathExists, destPathExists] = await Promise.all([
    RNFS.exists(filePath),
    RNFS.exists(destPath),
  ]);
  if (!filePathExists) {
    throw new Error(`File ${filePath} cannot be moved as it does not exist`);
  }
  if (destPathExists) {
    console.warn(`Trying to move file that already exists: ${destPath}`);
    await RNFS.unlink(destPath);
  }
  await RNFS.moveFile(filePath, destPath);
};

export const moveAssetsForMessage = async (
  fromMessageId: string,
  toMessageId: string
) => {
  const oldMessageFolder = `${RNFS.DocumentDirectoryPath}/messages/${fromMessageId}`;
  const newMessageFolder = `${RNFS.DocumentDirectoryPath}/messages/${toMessageId}`;
  const oldMessageFolderExists = await RNFS.exists(oldMessageFolder);
  if (oldMessageFolderExists) {
    await moveFileAndReplace(oldMessageFolder, newMessageFolder);
  }
};

export const createTemporaryDirectory = async () => {
  const tempDir = path.join(RNFS.TemporaryDirectoryPath, uuidv4());
  await RNFS.mkdir(tempDir);
  return tempDir;
};

export const getDatabaseFilesForInboxId = async (inboxId: string) => {
  const dbDirectory = await getDbDirectory();
  const dbDirectoryExists = await RNFS.exists(dbDirectory);
  if (!dbDirectoryExists) return [];
  const dbDirectoryFiles = await RNFS.readDir(dbDirectory);
  const dbDirectoryXmtpDbFiles = dbDirectoryFiles.filter(
    (f) => f.name.startsWith("xmtp-") && f.name.includes(`${inboxId}.db3`)
  );
  return dbDirectoryXmtpDbFiles;
};

export const deleteLibXmtpDatabaseForInboxId = async (inboxId: string) => {
  const dbDirectoryXmtpDbFiles = await getDatabaseFilesForInboxId(inboxId);
  for (const dbFile of dbDirectoryXmtpDbFiles) {
    logger.debug("Deleting database file", dbFile.name);
    await RNFS.unlink(dbFile.path);
  }
};
