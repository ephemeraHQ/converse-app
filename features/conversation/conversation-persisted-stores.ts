import { zustandMMKVStorage } from "@utils/mmkv";
import { createStore, useStore } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { Nullable } from "../../types/general";
import { useConversationStore } from "./conversation-store";

export type IComposerMediaPreviewStatus =
  | "picked"
  | "uploading"
  | "uploaded"
  | "error"
  | "sending";

export type IComposerMediaPreview = {
  status: IComposerMediaPreviewStatus;
  mediaURI: string;
  mimeType: Nullable<string>;
  dimensions?: {
    width: number;
    height: number;
  };
} | null;

type IConversationPersistedStore = {
  inputValue: string;
  replyingToMessageId: string | null;
  composerMediaPreview: IComposerMediaPreview;
};

// Cache of conversation stores
const conversationPersistedStores = new Map<
  string,
  ReturnType<typeof createConversationPersistedStore>
>();

// Custom persistence logic
// Factory function to create a store for each conversation with persistence
const createConversationPersistedStore = (conversationTopic: string) =>
  createStore<IConversationPersistedStore>()(
    subscribeWithSelector(
      persist(
        (set) => ({
          inputValue: "",
          replyingToMessageId: null,
          composerMediaPreview: null,
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: `conversation_${conversationTopic}`, // unique storage key for each conversation
          partialize: (state) => ({
            inputValue: state.inputValue,
            replyingToMessageId: state.replyingToMessageId,
            mediaPreview: state.composerMediaPreview,
          }),
        }
      )
    )
  );

// Hook to get or create the store for a conversation
export const getConversationPersistedStore = (conversationTopic: string) => {
  if (!conversationPersistedStores.has(conversationTopic)) {
    conversationPersistedStores.set(
      conversationTopic,
      createConversationPersistedStore(conversationTopic)
    );
  }
  return conversationPersistedStores.get(conversationTopic)!;
};

export function useConversationPersistedStore(topic: string) {
  if (!topic) {
    throw new Error("Topic is not defined");
  }
  return getConversationPersistedStore(topic);
}

export function useConversationPersistedStoreState<T>(
  conversationTopic: string,
  selector: (state: IConversationPersistedStore) => T
) {
  const store = getConversationPersistedStore(conversationTopic);
  return useStore(store, selector);
}

// Maybe put somewhere else
export function getCurrentConversationPersistedStore() {
  const topic = useConversationStore.getState().topic;
  if (!topic) {
    throw new Error("Topic is not defined");
  }
  return getConversationPersistedStore(topic);
}

// Maybe put somewhere else
export function useCurrentConversationPersistedStoreState<T>(
  selector: (state: IConversationPersistedStore) => T
) {
  const topic = useConversationStore((state) => state.topic);
  if (!topic) {
    throw new Error("Topic is not defined");
  }
  return useConversationPersistedStoreState(topic, selector);
}
