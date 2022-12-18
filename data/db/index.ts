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
    console.log("Database initialized!");
  } catch (e) {
    console.log("Error initializing Database: ", e);
  }
};
