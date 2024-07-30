import { getDbDirectory } from "@data/db";
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

export const copyDatabasesToTemporaryDirectory = async (
  tempDirectory: string
) => {
  const dbDirectory = await getDbDirectory();
  const dbDirectoryExists = await RNFS.exists(dbDirectory);
  if (!dbDirectoryExists) return;
  const dbDirectoryFiles = await RNFS.readDir(dbDirectory);
  const dbDirectoryXmtpDbFiles = dbDirectoryFiles.filter(
    (f) => f.name.startsWith("xmtp-") && f.name.endsWith(".db3")
  );
  for (const dbFile of dbDirectoryXmtpDbFiles) {
    console.log("Copying DB file", dbFile.name);
    await RNFS.copyFile(dbFile.path, path.join(tempDirectory, dbFile.name));
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
      console.log("Deleting destination db file");
      await RNFS.unlink(destinationPath);
    }
    const walFileExists = await RNFS.exists(`${destinationPath}-wal`);
    if (walFileExists) {
      console.log("Deleting destination wal file");
      await RNFS.unlink(`${destinationPath}-wal`);
    }
    const shmFileExists = await RNFS.exists(`${destinationPath}-shm`);
    if (shmFileExists) {
      console.log("Deleting destination db shm file");
      await RNFS.unlink(`${destinationPath}-shm`);
    }

    console.log(`Moving ${dbFile.name} to db directory`);
    await RNFS.moveFile(sourcePath, destinationPath);
  }

  console.log("All files moved successfully");
  await RNFS.unlink(tempDirectory);
};
