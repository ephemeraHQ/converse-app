import { saveTopicsData } from "../../utils/api";
import { getChatStore } from "../store/accountsStore";
import { TopicData } from "../store/chatStore";

export const setTopicsData = async (account: string) => {
  // Send to our servers the topics data that was locally available (i.e. readUntil)
  // in the future we will be able to just delete that code and remove the readUntil
  // column from DB !
  console.log(
    `[Async Updates] Running 002-setTopicsData for account: ${account}`
  );
  const topicsData = getChatStore(account).getState().topicsData as {
    [topic: string]: TopicData;
  };
  console.log("CURRENT TOPICS DATA IS", topicsData);
  const conversations = getChatStore(account).getState().conversations;
  for (const topic in conversations) {
    if (conversations[topic].readUntil) {
      topicsData[topic] = topicsData[topic] || { status: "read" };
      (topicsData[topic] as TopicData).readUntil =
        conversations[topic].readUntil;
    }
  }
  console.log("TOPICS DATA TO SAVE WILL BE", topicsData);
  getChatStore(account).getState().setTopicsData(topicsData);
  await saveTopicsData(account, topicsData);
};
