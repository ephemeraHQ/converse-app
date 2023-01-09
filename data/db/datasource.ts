import "reflect-metadata";
import { DataSource } from "typeorm/browser";

import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";
import { init1671623489366 } from "./migrations/1671623489366-init";
import { addLensHandle1671788934503 } from "./migrations/1671788934503-addLensHandle";
import { addEnsName1673277126468 } from "./migrations/1673277126468-addEnsName";

const dataSource = new DataSource({
  database: "converse",
  driver: require("expo-sqlite"),
  entities: [Conversation, Message],
  synchronize: false,
  migrationsRun: false,
  migrations: [
    init1671623489366,
    addLensHandle1671788934503,
    addEnsName1673277126468,
  ],
  type: "expo",
});

export default dataSource;
