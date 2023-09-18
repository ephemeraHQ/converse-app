import "reflect-metadata";
// import { typeORMDriver } from "react-native-quick-sqlite";
import { Platform } from "react-native";
import { DataSource } from "typeorm/browser";

import { Conversation } from "./entities/conversationEntity";
import { Message } from "./entities/messageEntity";
import { Profile } from "./entities/profileEntity";
import { TypeORMLogger } from "./logger";
import { init1671623489366 } from "./migrations/1671623489366-init";
import { addLensHandle1671788934503 } from "./migrations/1671788934503-addLensHandle";
import { addEnsName1673277126468 } from "./migrations/1673277126468-addEnsName";
import { addMessageStatus1680616920220 } from "./migrations/1680616920220-addMessageStatus";
import { addStatusIndex1681209069007 } from "./migrations/1681209069007-addStatusIndex";
import { addReadStatus1683114681319 } from "./migrations/1683114681319-addReadStatus";
import { addSentViaConverse1684057254703 } from "./migrations/1684057254703-addSentViaConverse";
import { addProfileEntity1686053217007 } from "./migrations/1686053217007-addProfileEntity";
import { removeHandlesFromConvo1686124833536 } from "./migrations/1686124833536-removeHandlesFromConvo";
import { addContentType1687793816866 } from "./migrations/1687793816866-addContentType";
import { addMessageReaction1688549487960 } from "./migrations/1688549487960-addMessageReaction";
import { addMessageFallback1690204801962 } from "./migrations/1690204801962-addMessageFallback";
import { addPendingStateToConversations1690376359971 } from "./migrations/1690376359971-addPendingStateToConversations";
import { fixWrongForeignKey1690809735000 } from "./migrations/1690809735000-fixWrongForeignKey";
import { removeForeignKeyForTesters1690989046000 } from "./migrations/1690989046000-removeForeignKeyForTesters";
import { addIndexToPendingConversation1691154310694 } from "./migrations/1691154310694-addIndexToPendingConversation";
import { addReferencedMessage1691397563214 } from "./migrations/1691397563214-addReferencedMessage";
import { removeOldReactions1691412759130 } from "./migrations/1691412759130-removeOldReactions";
import { AddVersionToConversation1695029413899 } from "./migrations/1695029413899-addVersionToConversation";

// We support SQLite from version 3.8.10.2 (embedded in Android 6.0 - SDK 23)
// For supported methods see https://www.sqlite.org/changes.html
// Upsert is not always supported (see ./upsert.ts)
// ADD COLUMN supported (added in version 3.2.0 - 2005-03-21)
// DROP COLUMN NOT SUPPORTED (added in version 3.35.0 - 2021-03-12)

const dataSources: { [account: string]: DataSource } = {};

export const getExistingDataSource = (
  account: string
): DataSource | undefined => {
  return dataSources[account];
};

export const getDataSource = async (account: string) => {
  const existingDatasource = getExistingDataSource(account);
  if (existingDatasource) return existingDatasource;

  const newDataSource = new DataSource({
    database: `converse-${account}.sqlite`,
    // driver: typeORMDriver,
    driver: require("react-native-sqlite-storage"),
    entities: [Conversation, Message, Profile],
    synchronize: false,
    migrationsRun: false,
    migrations: [
      init1671623489366,
      addLensHandle1671788934503,
      addEnsName1673277126468,
      addMessageStatus1680616920220,
      addStatusIndex1681209069007,
      addReadStatus1683114681319,
      addSentViaConverse1684057254703,
      addProfileEntity1686053217007,
      removeHandlesFromConvo1686124833536,
      addContentType1687793816866,
      addMessageReaction1688549487960,
      addMessageFallback1690204801962,
      addPendingStateToConversations1690376359971,
      fixWrongForeignKey1690809735000,
      removeForeignKeyForTesters1690989046000,
      addIndexToPendingConversation1691154310694,
      addReferencedMessage1691397563214,
      removeOldReactions1691412759130,
      AddVersionToConversation1695029413899,
    ],
    type: "react-native",
    location: Platform.OS === "ios" ? "Shared" : "./SQLite",
    // type: "expo",
    logging: true,
    maxQueryExecutionTime: 150,
    logger: new TypeORMLogger(),
  });
  dataSources[account] = newDataSource;
  return newDataSource;
};

export const deleteDataSource = (account: string) => {
  delete dataSources[account];
};
