import * as SQLite from "expo-sqlite";

import dataSource from "./datasource";
import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";
import { Profile } from "./entities/profile";
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
    const db = SQLite.openDatabase("converse");
    await db.closeAsync();
    await db.deleteAsync();
    if (reset) {
      initDb();
    }
  } catch (e) {
    console.log("Could not drop database", e);
  }
}
