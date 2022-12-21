import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";

import { init1671623489366 } from "../../data/db/migrations/1671623489366-init";
import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";

const dataSource = new DataSource({
  database: path.join(__dirname, "converse-sample.sqlite"),
  entities: [Conversation, Message],
  synchronize: false,
  migrationsRun: false,
  migrations: [init1671623489366],
  type: "sqlite",
});

export default dataSource;
