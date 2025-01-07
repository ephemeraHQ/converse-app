import { create } from "zustand";
import { RolledUpReactions } from "../conversation-message-reactions.types";

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
    },
  });
}
