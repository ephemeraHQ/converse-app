import { ConversationId, ConversationTopic } from "@xmtp/react-native-sdk";
import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IConversationStoreProps = {
  topic: ConversationTopic;
  conversationId: ConversationId;
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
  };
  return createStore<IConversationStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
  }));
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