import { zustandMMKVStorage } from "@utils/mmkv";
import { ConversationTopic, MessageId } from "@xmtp/react-native-sdk";
import { createStore, useStore } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { Nullable } from "@/types/general";

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
  replyingToMessageId: MessageId | null;
  composerMediaPreview: IComposerMediaPreview;
};

// Cache of conversation stores
const conversationPersistedStores = new Map<
  string,
  ReturnType<typeof createConversationPersistedStore>
>();

const creatConversationStore = (name: string) =>
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
          name, // unique storage key for each conversation
          partialize: (state) => ({
            inputValue: state.inputValue,
            replyingToMessageId: state.replyingToMessageId,
            mediaPreview: state.composerMediaPreview,
          }),
        }
      )
    )
  );

// const newConversationStore = creatConversationStore("new_conversation");

// Custom persistence logic
// Factory function to create a store for each conversation with persistence
const createConversationPersistedStore = (
  conversationTopic: ConversationTopic
) => creatConversationStore(`conversation_${conversationTopic}`);

// Hook to get or create the store for a conversation
export const getConversationPersistedStore = (
  conversationTopic: ConversationTopic
) => {
  if (!conversationPersistedStores.has(conversationTopic)) {
    conversationPersistedStores.set(
      conversationTopic,
      createConversationPersistedStore(conversationTopic)
    );
  }
  return conversationPersistedStores.get(conversationTopic)!;
};

export function useConversationPersistedStore(topic: ConversationTopic) {
  return getConversationPersistedStore(topic);
}

export function useConversationPersistedStoreState<T>(
  conversationTopic: ConversationTopic,
  selector: (state: IConversationPersistedStore) => T
) {
  const store = getConversationPersistedStore(conversationTopic);
  return useStore(store, selector);
}

export function getCurrentConversationPersistedStore() {
  const topic = useConversationStore.getState().topic;
  return getConversationPersistedStore(topic);
}

export function useCurrentConversationPersistedStoreState<T>(
  selector: (state: IConversationPersistedStore) => T
) {
  const topic = useConversationStore((state) => state.topic);
  return useConversationPersistedStoreState(topic, selector);
}
