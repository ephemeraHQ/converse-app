import { zustandMMKVStorage } from "@utils/mmkv";
import { StoreApi, createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type IConversationStore = {
  inputValue: string;
};

// Cache of conversation stores
const conversationStores = new Map<string, StoreApi<IConversationStore>>();

// Custom persistence logic
// Factory function to create a store for each conversation with persistence
const createConversationStore = (conversationId: string) =>
  createStore<IConversationStore>()(
    persist(
      (set) => ({
        inputValue: "",
      }),
      {
        storage: createJSONStorage(() => zustandMMKVStorage),
        name: `conversation_${conversationId}`, // unique storage key for each conversation
        partialize: (state) => ({
          inputValue: state.inputValue,
        }),
      }
    )
  );

// Hook to get or create the store for a conversation
export const getConversationStore = (conversationId: string) => {
  if (!conversationStores.has(conversationId)) {
    conversationStores.set(
      conversationId,
      createConversationStore(conversationId)
    );
  }
  return conversationStores.get(conversationId)!;
};
