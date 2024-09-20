import "reflect-metadata";

import path from "path";
import { DataSource } from "typeorm";

import { Conversation } from "./entities/conversationEntity";
import { Message } from "./entities/messageEntity";
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
import { removeForeignKeyForTesters1690989046000 } from "../../data/db/migrations/1690989046000-removeForeignKeyForTesters";
import { addIndexToPendingConversation1691154310694 } from "../../data/db/migrations/1691154310694-addIndexToPendingConversation";
import { addReferencedMessage1691397563214 } from "../../data/db/migrations/1691397563214-addReferencedMessage";
import { removeOldReactions1691412759130 } from "../../data/db/migrations/1691412759130-removeOldReactions";
import { AddVersionToConversation1695029413899 } from "../../data/db/migrations/1695029413899-addVersionToConversation";
import { AddSpamScore1698068091873 } from "../../data/db/migrations/1698068091873-addSpamScore";
import { AddGroupConversations1708332276329 } from "../../data/db/migrations/1708332276329-addGroupConversations";
import { AddConverseMessageMetadata1709030178271 } from "../../data/db/migrations/1709030178271-addConverseMessageMetadata";
import { AddLastNotifSubscribePeriodToConversation1709893391562 } from "../../data/db/migrations/1709893391562-addLastNotifSubscribePeriodToConversation";
import { AddIndexToSent1712656017130 } from "../../data/db/migrations/1712656017130-addIndexToSent";
import { RemoveSentViaConverse1717625558678 } from "../../data/db/migrations/1717625558678-RemoveSentViaConverse";
import { AddSuperAdmin1717631723249 } from "../../data/db/migrations/1717631723249-AddSuperAdmin";
import { AddIsActive1721143963530 } from "../../data/db/migrations/1721143963530-addIsActive";
import { AddGroupCreatorAndAddedBy1726807503232 } from "../../data/db/migrations/1726807503232-AddGroupCreatorAndAddedBy";
import { RemoveProfile1726828413530 } from "../../data/db/migrations/1726828413530-removeProfileDb";

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
    AddSpamScore1698068091873,
    AddConverseMessageMetadata1709030178271,
    AddLastNotifSubscribePeriodToConversation1709893391562,
    AddIndexToSent1712656017130,
    AddGroupConversations1708332276329,
    RemoveSentViaConverse1717625558678,
    AddSuperAdmin1717631723249,
    AddIsActive1721143963530,
    AddGroupCreatorAndAddedBy1726807503232,
    RemoveProfile1726828413530,
  ],
  type: "sqlite",
});

export default dataSource;
