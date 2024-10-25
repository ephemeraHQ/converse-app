import { create } from "zustand";

import { RolledUpReactions } from "../MessageReactions.types";

const initialMessageReactionsState: RolledUpReactions = {
  emojis: [],
  totalReactions: 0,
  userReacted: false,
  details: {},
};

export interface IMessageReactionsStore {
  rolledUpReactions: RolledUpReactions;
  setRolledUpReactions: (reactions: RolledUpReactions) => void;

  // TODO: update state when new reactions come up and drawer is open
  // updateReactions: (updates: Partial<RolledUpReactions>) => void;
}

export const useMessageReactionsStore = create<IMessageReactionsStore>(
  (set) => ({
    rolledUpReactions: initialMessageReactionsState,
    setRolledUpReactions: (reactions) => set({ rolledUpReactions: reactions }),
  })
);

export const resetMessageReactionsStore = () => {
  useMessageReactionsStore
    .getState()
    .setRolledUpReactions(initialMessageReactionsState);
};
