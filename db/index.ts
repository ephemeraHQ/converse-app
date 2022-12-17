import dataSource from "./datasource";
import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";

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

export const upsertConversations = async (conversations: Conversation[]) => {
  await dataSource.getRepository(Conversation).upsert(conversations, ["topic"]);
};

export const getConversations = () =>
  dataSource.getRepository(Conversation).find();

export const upsertMessages = async (messages: Message[]) => {
  await dataSource.getRepository(Message).upsert(messages, ["id"]);
};

export const getMessages = () => dataSource.getRepository(Message).find();
