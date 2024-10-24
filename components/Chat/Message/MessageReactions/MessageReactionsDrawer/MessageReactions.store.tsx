import { create } from "zustand";

import { RolledUpReactions } from "../MessageReactions.types";

export interface IMessageReactionsStore {
  rolledUpReactions: RolledUpReactions;
}

export const initialMessageReactionsState: IMessageReactionsStore = {
  rolledUpReactions: {
    emojis: [],
    totalReactions: 0,
    userReacted: false,
    details: {},
  },
};

export const useMessageReactionsStore = create<IMessageReactionsStore>(
  (set, get) => ({
    ...initialMessageReactionsState,
  })
);

export const resetMessageReactionsStore = () => {
  useMessageReactionsStore.setState(initialMessageReactionsState);
};
