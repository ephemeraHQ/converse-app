import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

// Chat data for each user

export type ChatStoreType = {
  initialLoadDone: boolean;
  setInitialLoadDone: () => void;
  initialLoadDoneOnce: boolean;

  localClientConnected: boolean;
  setLocalClientConnected: (connected: boolean) => void;
  webviewClientConnected: boolean;
  setWebviewClientConnected: (connected: boolean) => void;

  resyncing: boolean;
  setResyncing: (syncing: boolean) => void;

  reconnecting: boolean;
  setReconnecting: (reconnecting: boolean) => void;
};

export const initChatStore = (account: string) => {
  const recommendationsStore = create<ChatStoreType>()(
    persist(
      (set) => ({
        initialLoadDone: false,
        initialLoadDoneOnce: false,
        setInitialLoadDone: () =>
          set(() => {
            // #TODO => mark every conversation as read if initial sync!
            // if (!state.initialLoadDoneOnce) {
            //     // If it's the initial sync, let's mark
            //     // all conversations as read
            //     for (const topic in newState.conversations) {
            //       const conversation = newState.conversations[topic];
            //       conversation.lastUpdateAt = now;
            //       if (conversation.messages.size > 0) {
            //         const lastMessage = lastValueInMap(conversation.messages);
            //         conversation.readUntil = lastMessage ? lastMessage.sent : 0;
            //       }
            //     }
            //     markAllConversationsAsReadInDb();
            return { initialLoadDone: true, initialLoadDoneOnce: true };
          }),
        localClientConnected: false,
        setLocalClientConnected: (c) =>
          set(() => ({ localClientConnected: c })),
        webviewClientConnected: false,
        setWebviewClientConnected: (c) =>
          set(() => ({ webviewClientConnected: c })),
        resyncing: false,
        setResyncing: (syncing) => set(() => ({ resyncing: syncing })),
        reconnecting: false,
        setReconnecting: (reconnecting) => set(() => ({ reconnecting })),
      }),
      {
        name: `store-${account}-chat`, // Account-based storage so each account can have its own chat data
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => ({
          initialLoadDoneOnce: state.initialLoadDoneOnce, // This one we want to persist!
        }),
      }
    )
  );
  return recommendationsStore;
};
