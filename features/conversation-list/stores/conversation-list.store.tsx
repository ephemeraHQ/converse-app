import {
  getCurrentUserAccountInboxId,
  useCurrentAccountInboxId,
} from "@/hooks/use-current-account-inbox-id";
import { zustandMMKVStorage } from "@/utils/mmkv";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type IActions = {
  setPinnedConversationTopics: (topics: ConversationTopic[]) => void;
};

type StoreState = {
  pinnedConversationTopics: ConversationTopic[];
  actions: IActions;
};

function createConversationListStore(inboxId: InboxId) {
  return create<StoreState>()(
    persist(
      (set) => {
        return {
          pinnedConversationTopics: [],
          actions: {
            setPinnedConversationTopics: (topics) =>
              set({ pinnedConversationTopics: topics }),
          },
        };
      },
      {
        name: `conversation-list-store-${inboxId}`,
        storage: createJSONStorage(() => zustandMMKVStorage),
        partialize: (state: StoreState) => ({
          pinnedConversationTopics: state.pinnedConversationTopics,
        }),
      }
    )
  );
}

const stores: Record<
  InboxId,
  ReturnType<typeof createConversationListStore>
> = {};

export function useConversationListStore(inboxId: InboxId) {
  if (!stores[inboxId]) {
    stores[inboxId] = createConversationListStore(inboxId);
  }
  return stores[inboxId];
}

export function useConversationListStoreForCurrentAccount<T>(
  selector: (state: StoreState) => T
) {
  const { data: inboxId } = useCurrentAccountInboxId();
  return useConversationListStore(inboxId!)(selector);
}

export function getConversationListStoreForCurrentAccount() {
  const inboxId = getCurrentUserAccountInboxId();
  if (!inboxId) return null;
  return stores[inboxId];
}

export function useConversationListStoreActions(): IActions {
  const { data: inboxId } = useCurrentAccountInboxId();
  return useConversationListStore(inboxId!)((s) => s.actions);
}
