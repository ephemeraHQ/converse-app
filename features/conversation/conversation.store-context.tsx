import { getCurrentAccount } from "@/data/store/accountsStore";
import { getDmQueryData } from "@/queries/useDmQuery";
import { getGroupQueryData } from "@/queries/useGroupQuery";
import {
  ConversationId,
  ConversationTopic,
  InboxId,
  MessageId,
} from "@xmtp/react-native-sdk";
import { createContext, memo, useContext, useEffect, useRef } from "react";
import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type IConversationStoreProps = {
  topic: ConversationTopic | null;
  conversationId: ConversationId;
  highlightedMessageId?: MessageId;
  scrollToMessageId?: MessageId;
  searchTextValue: string;
  searchSelectedUserInboxIds: InboxId[];
  isCreatingNewConversation: boolean;
};

type IConversationStoreState = IConversationStoreProps & {};

type IConversationStoreProviderProps =
  React.PropsWithChildren<IConversationStoreProps>;

type IConversationStore = ReturnType<typeof createConversationStore>;

export const ConversationStoreProvider = memo(
  ({ children, ...props }: IConversationStoreProviderProps) => {
    const storeRef = useRef<IConversationStore>();
    if (!storeRef.current) {
      storeRef.current = createConversationStore(props);
    }

    return (
      <ConversationStoreContext.Provider value={storeRef.current}>
        {children}
      </ConversationStoreContext.Provider>
    );
  }
);

const createConversationStore = (initProps: IConversationStoreProps) => {
  const DEFAULT_PROPS: IConversationStoreProps = {
    topic: null as unknown as ConversationTopic,
    conversationId: null as unknown as ConversationId,
    highlightedMessageId: undefined,
    scrollToMessageId: undefined,
    searchTextValue: "",
    searchSelectedUserInboxIds: [],
    isCreatingNewConversation: false,
  };
  return createStore<IConversationStoreState>()(
    subscribeWithSelector((set) => ({
      ...DEFAULT_PROPS,
      ...initProps,
    }))
  );
};

const ConversationStoreContext = createContext<IConversationStore | null>(null);

export function useConversationStoreContext<T>(
  selector: (state: IConversationStoreState) => T
): T {
  const store = useContext(ConversationStoreContext);
  if (!store) throw new Error("Missing ConversationStore.Provider in the tree");
  return useStore(store, selector);
}

export function useConversationStore() {
  const store = useContext(ConversationStoreContext);
  if (!store) throw new Error(`Missing ConversationStore.Provider in the tree`);
  return store;
}

export function useCurrentConversationTopic() {
  return useConversationStoreContext((state) => state.topic);
}

export function useConversationCurrentConversationId() {
  return useConversationStoreContext((state) => state.conversationId);
}
