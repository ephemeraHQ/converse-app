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

export const copyDatabasesToTemporaryDirectory = async (
  tempDirectory: string,
  inboxId: string
) => {
  const dbDirectoryXmtpDbFiles = await getDatabaseFilesForInboxId(inboxId);
  for (const dbFile of dbDirectoryXmtpDbFiles) {
    logger.debug("Copying database file", dbFile.name);
    await RNFS.copyFile(dbFile.path, path.join(tempDirectory, dbFile.name));
  }
};

export const deleteLibXmtpDatabaseForInboxId = async (inboxId: string) => {
  const dbDirectoryXmtpDbFiles = await getDatabaseFilesForInboxId(inboxId);
  for (const dbFile of dbDirectoryXmtpDbFiles) {
    logger.debug("Deleting database file", dbFile.name);
    await RNFS.unlink(dbFile.path);
  }
};

export const moveTemporaryDatabasesToDatabaseDirecory = async (
  tempDirectory: string,
  inboxId: string
) => {
  const sourceFolderExists = await RNFS.exists(tempDirectory);
  if (!sourceFolderExists) {
    throw new Error(`Temporary folder does not exist: ${tempDirectory}`);
  }

  const dbDirectory = await getDbDirectory();

  const destinationFolderExists = await RNFS.exists(dbDirectory);
  if (!destinationFolderExists) {
    await RNFS.mkdir(dbDirectory);
  }

  const tempDirectoryFiles = await RNFS.readDir(tempDirectory);
  const tempDirectoryXmtpDbFiles = tempDirectoryFiles.filter(
    (f) => f.name.startsWith("xmtp-") && f.name.endsWith(`${inboxId}.db3`)
  );

  for (const dbFile of tempDirectoryXmtpDbFiles) {
    const sourcePath = `${tempDirectory}/${dbFile.name}`;
    const destinationPath = `${dbDirectory}/${dbFile.name}`;
    const destinationFileExists = await RNFS.exists(destinationPath);
    if (destinationFileExists) {
      logger.debug("Deleting destination db file");
      await RNFS.unlink(destinationPath);
    }
    const destinationWalFileExists = await RNFS.exists(
      `${destinationPath}-wal`
    );
    if (destinationWalFileExists) {
      logger.debug("Deleting destination wal file");
      await RNFS.unlink(`${destinationPath}-wal`);
    }
    const destinationShmFileExists = await RNFS.exists(
      `${destinationPath}-shm`
    );
    if (destinationShmFileExists) {
      logger.debug("Deleting destination db shm file");
      await RNFS.unlink(`${destinationPath}-shm`);
    }

    logger.debug(`Moving ${dbFile.name} to db directory`);
    await RNFS.moveFile(sourcePath, destinationPath);

    const originWalFileExists = await RNFS.exists(`${sourcePath}-wal`);
    if (originWalFileExists) {
      logger.debug("Moving origin wal file");
      await RNFS.moveFile(`${sourcePath}-wal`, `${destinationPath}-wal`);
    }
    const originShmFileExists = await RNFS.exists(`${sourcePath}-shm`);
    if (originShmFileExists) {
      logger.debug("Moving origin shm file");
      await RNFS.moveFile(`${sourcePath}-shm`, `${destinationPath}-shm`);
    }
  }

  logger.debug("All files moved successfully");
  await RNFS.unlink(tempDirectory);
};
