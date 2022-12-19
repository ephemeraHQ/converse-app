import * as SQLite from "expo-sqlite";

import { addLog } from "../../components/DebugButton";
import dataSource from "./datasource";
import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";

export const conversationRepository = dataSource.getRepository(Conversation);

export const messageRepository = dataSource.getRepository(Message);

export const initDb = async () => {
  if (dataSource.isInitialized) {
    return;
  }
  console.log("Initializing Database...");
  try {
    await dataSource.initialize();
    addLog("Database initialized!");
    console.log("Database initialized!");
  } catch (e: any) {
    addLog("Error initializing Database: ");
    addLog(e.toString());
    console.log("Error initializing Database: ", e);
  }
};

export async function clearDB() {
  try {
    await dataSource.destroy();
    const db = SQLite.openDatabase("converse");
    await db.closeAsync();
    await db.deleteAsync();
    initDb();
  } catch (e) {
    console.log("Could not drop database", e);
  }
}
