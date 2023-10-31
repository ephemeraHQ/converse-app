import { getRepository } from "../../db";
import { getChatStore } from "../../store/accountsStore";

export const saveSpamScore = async (
  account: string,
  topic: string,
  spamScore: number
) => {
  const conversationRepository = await getRepository(account, "conversation");
  await conversationRepository.update({ topic }, { spamScore });

  getChatStore(account).getState().setSpamScore(topic, spamScore);
};
