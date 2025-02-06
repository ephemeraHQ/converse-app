import { create } from "zustand";
import { RolledUpReactions } from "../conversation-message-reactions.types";
import { MessageId } from "@xmtp/react-native-sdk";

export type IMessageReactionsStore = {
  rolledUpReactions: RolledUpReactions;
  setRolledUpReactions: (reactions: RolledUpReactions) => void;
};

export const useMessageReactionsStore = create<IMessageReactionsStore>(
  (set) => ({
    rolledUpReactions: {
      preview: [],
      detailed: [],
      totalCount: 0,
      userReacted: false,
      messageId: "" as MessageId,
    },
    setRolledUpReactions: (reactions) => set({ rolledUpReactions: reactions }),
  })
);

export function resetMessageReactionsStore() {
  useMessageReactionsStore.setState({
    rolledUpReactions: {
      preview: [],
      detailed: [],
      totalCount: 0,
      userReacted: false,
      messageId: "" as MessageId,
    },
  });
}
