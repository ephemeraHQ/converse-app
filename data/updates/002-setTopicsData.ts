import { getChatStore } from "@features/accounts/accounts.store";
import logger from "@utils/logger";

import { saveTopicsData } from "../../utils/api";
import { TopicData } from "../store/chatStore";

export const setTopicsData = async (account: string) => {
  // Send to our servers the topics data that was locally available (i.e. readUntil)
  // in the future we will be able to just delete that code and remove the readUntil
  // column from DB !
  logger.debug(
    `[Async Updates] Running 002-setTopicsData for account: ${account}`
  );
  const topicsData = getChatStore(account).getState().topicsData as {
    [topic: string]: TopicData;
  };
  logger.debug("CURRENT TOPICS DATA IS", topicsData);
  const conversations = getChatStore(account).getState().conversations;
  const timestamp = new Date().getTime();
  for (const topic in conversations) {
    if (conversations[topic].readUntil) {
      topicsData[topic] = topicsData[topic] || {};
      (topicsData[topic] as TopicData).readUntil =
        conversations[topic].readUntil;
      (topicsData[topic] as TopicData).timestamp = timestamp;
    }
  }
  logger.debug("TOPICS DATA TO SAVE WILL BE", topicsData);
  getChatStore(account).getState().setTopicsData(topicsData);
  await saveTopicsData(account, topicsData);
};
