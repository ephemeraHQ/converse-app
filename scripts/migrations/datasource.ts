import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";

import { init1671623489366 } from "../../data/db/migrations/1671623489366-init";
import { addLensHandle1671788934503 } from "../../data/db/migrations/1671788934503-addLensHandle";
import { addEnsName1673277126468 } from "../../data/db/migrations/1673277126468-addEnsName";
import { addMessageStatus1680616920220 } from "../../data/db/migrations/1680616920220-addMessageStatus";
import { addStatusIndex1681209069007 } from "../../data/db/migrations/1681209069007-addStatusIndex";
import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";

const dataSource = new DataSource({
  database: path.join(__dirname, "converse-sample.sqlite"),
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
  type: "sqlite",
});

export default dataSource;
