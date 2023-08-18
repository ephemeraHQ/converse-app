import "reflect-metadata";

import { saveXmtpEnv, saveApiURI } from "../utils/sharedData/sharedData";
import { getRepository } from "./db";
import { loadProfilesByAddress } from "./helpers/profiles";
import { xmtpConversationFromDb } from "./mappers";
import { getChatStore, getProfilesStore } from "./store/accountsStore";

export const loadDataToContext = async (account: string) => {
  // Save env to shared data with extension
  saveXmtpEnv();
  saveApiURI();
  const conversationRepository = getRepository(account, "conversation");
  // Let's load conversations and messages and save to context
  const conversationsWithMessages = await conversationRepository.find({
    relations: { messages: true },
    order: { messages: { sent: "ASC" } },
  });
  const profilesByAddress = await loadProfilesByAddress(account);
  getProfilesStore(account).getState().setProfiles(profilesByAddress);
  getChatStore(account)
    .getState()
    .setConversations(
      conversationsWithMessages.map((c) =>
        xmtpConversationFromDb(c, profilesByAddress[c.peerAddress]?.socials)
      )
    );
};
