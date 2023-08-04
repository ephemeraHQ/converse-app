import "reflect-metadata";

import { saveXmtpEnv, saveApiURI } from "../utils/sharedData/sharedData";
import { conversationRepository } from "./db";
import { loadProfilesByAddress } from "./helpers/profiles";
import { xmtpConversationFromDb } from "./mappers";
import { useChatStore, useProfilesStore } from "./store/accountsStore";

export const loadDataToContext = async () => {
  // Save env to shared data with extension
  saveXmtpEnv();
  saveApiURI();
  // Let's load conversations and messages and save to context
  const conversationsWithMessages = await conversationRepository.find({
    relations: { messages: true },
    order: { messages: { sent: "ASC" } },
  });
  const profilesByAddress = await loadProfilesByAddress();
  useProfilesStore.getState().setProfiles(profilesByAddress);
  useChatStore
    .getState()
    .setConversations(
      conversationsWithMessages.map((c) =>
        xmtpConversationFromDb(c, profilesByAddress[c.peerAddress]?.socials)
      )
    );
};
