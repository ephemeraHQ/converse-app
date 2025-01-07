import { create } from "zustand";
import { RolledUpReactions } from "../conversation-message-reactions.types";

export type IMessageReactionsStore = {
  rolledUpReactions: RolledUpReactions;
  isVisible: boolean;
  setRolledUpReactions: (reactions: RolledUpReactions) => void;
  setIsVisible: (isVisible: boolean) => void;
};

export const useMessageReactionsStore = create<IMessageReactionsStore>(
  (set) => ({
    rolledUpReactions: {
      preview: [],
      detailed: [],
      totalCount: 0,
      userReacted: false,
    },
    isVisible: false,
    setRolledUpReactions: (reactions) => set({ rolledUpReactions: reactions }),
    setIsVisible: (isVisible) => set({ isVisible }),
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
    isVisible: false,
  });
}
