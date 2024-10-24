import { create } from "zustand";

import { MessageToDisplay } from "../../Message";

export interface IMessageReactionsStore {
  message: MessageToDisplay | null;
}

export const useMessageReactionsStore = create<IMessageReactionsStore>(
  (set, get) => ({
    message: null,
  })
);
