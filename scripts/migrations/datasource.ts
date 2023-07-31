import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";

import { init1671623489366 } from "../../data/db/migrations/1671623489366-init";
import { addLensHandle1671788934503 } from "../../data/db/migrations/1671788934503-addLensHandle";
import { addEnsName1673277126468 } from "../../data/db/migrations/1673277126468-addEnsName";
import { addMessageStatus1680616920220 } from "../../data/db/migrations/1680616920220-addMessageStatus";
import { addStatusIndex1681209069007 } from "../../data/db/migrations/1681209069007-addStatusIndex";
import { addReadStatus1683114681319 } from "../../data/db/migrations/1683114681319-addReadStatus";
import { addSentViaConverse1684057254703 } from "../../data/db/migrations/1684057254703-addSentViaConverse";
import { addProfileEntity1686053217007 } from "../../data/db/migrations/1686053217007-addProfileEntity";
import { removeHandlesFromConvo1686124833536 } from "../../data/db/migrations/1686124833536-removeHandlesFromConvo";
import { addContentType1687793816866 } from "../../data/db/migrations/1687793816866-addContentType";
import { addMessageReaction1688549487960 } from "../../data/db/migrations/1688549487960-addMessageReaction";
import { addMessageFallback1690204801962 } from "../../data/db/migrations/1690204801962-addMessageFallback";
import { addPendingStateToConversations1690376359971 } from "../../data/db/migrations/1690376359971-addPendingStateToConversations";
import { fixWrongForeignKey1690809735000 } from "../../data/db/migrations/1690809735000-fixWrongForeignKey";
import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";
import { Profile } from "./entities/profile";

const dataSource = new DataSource({
  database: path.join(__dirname, "converse-sample.sqlite"),
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
  ],
  type: "sqlite",
});

export default dataSource;
