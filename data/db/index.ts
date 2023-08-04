import RNFS from "react-native-fs";

import dataSource from "./datasource";
import { Conversation } from "./entities/conversationEntity";
import { Message } from "./entities/messageEntity";
import { Profile } from "./entities/profileEntity";
import { checkUpsertSupport } from "./upsert";

export const conversationRepository = dataSource.getRepository(Conversation);
export const messageRepository = dataSource.getRepository(Message);
export const profileRepository = dataSource.getRepository(Profile);

export const initDb = async () => {
  if (dataSource.isInitialized) {
    return;
  }
  console.log("Initializing Database...");
  try {
    await dataSource.initialize();
    console.log("Database initialized!");
    await checkUpsertSupport(dataSource);
    try {
      console.log("Running migrations...");
      const r = await dataSource.runMigrations();
      console.log("Migrations done!", r);
    } catch (e: any) {
      console.log("Error running migrations - destroying db", e);
      await clearDB();
    }
  } catch (e: any) {
    console.log("Error initializing Database: ", e);
  }
};

export async function clearDB(reset = true) {
  try {
    await dataSource.destroy();
    console.log(`[ClearDB] Datasource destroyed!`);
  } catch (e) {
    console.log(`[ClearDB] Couldn't destroy datasource: ${e}`);
  }

  // Now let's delete the database file
  const dbPath = `${RNFS.DocumentDirectoryPath}/SQLite/converse`;
  const dbExists = await RNFS.exists(dbPath);
  if (!dbExists) {
    console.log(`[ClearDB] SQlite file does not exist, no need to delete`);
  } else {
    console.log(`[ClearDB] Deleting SQlite file`);
    await RNFS.unlink(dbPath);
  }

  if (reset) {
    return initDb();
  }
}
