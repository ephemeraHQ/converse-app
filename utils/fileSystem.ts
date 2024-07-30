import { getDbDirectory } from "@data/db";
import path from "path";
import RNFS from "react-native-fs";
import { v4 as uuidv4 } from "uuid";

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
