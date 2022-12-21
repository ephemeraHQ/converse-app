import "reflect-metadata";
import { DataSource } from "typeorm/browser";

import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";
import { init1671623489366 } from "./migrations/1671623489366-init";

const dataSource = new DataSource({
  database: "converse",
  driver: require("expo-sqlite"),
  entities: [Conversation, Message],
  synchronize: false,
  migrationsRun: false,
  migrations: [init1671623489366],
  type: "expo",
});

export default dataSource;
