import "reflect-metadata";
import { DataSource } from "typeorm/browser";

import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";
import { init1671623489366 } from "./migrations/1671623489366-init";
import { addLensHandle1671788934503 } from "./migrations/1671788934503-addLensHandle";
import { addEnsName1673277126468 } from "./migrations/1673277126468-addEnsName";
import { addMessageStatus1680616920220 } from "./migrations/1680616920220-addMessageStatus";
import { addStatusIndex1681209069007 } from "./migrations/1681209069007-addStatusIndex";

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
    addMessageStatus1680616920220,
    addStatusIndex1681209069007,
  ],
  type: "expo",
});

export default dataSource;
