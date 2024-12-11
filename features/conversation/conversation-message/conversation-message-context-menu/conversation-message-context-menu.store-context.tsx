import { MessageId } from "@xmtp/react-native-sdk";
import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type IMessageContextMenuStoreProps = {};

export type IMessageContextMenuStoreState = IMessageContextMenuStoreProps & {
  messageContextMenuData: {
    messageId: MessageId;
    itemRectX: number;
    itemRectY: number;
    itemRectHeight: number;
    itemRectWidth: number;
    messageComponent: React.ReactNode;
  } | null;
  setMessageContextMenuData: (
    data: IMessageContextMenuStoreState["messageContextMenuData"]
  ) => void;
};

type IMessageContextMenuStoreProviderProps =
  React.PropsWithChildren<IMessageContextMenuStoreProps>;

type IMessageContextMenuStore = ReturnType<
  typeof createMessageContextMenuStore
>;

export const MessageContextMenuStoreProvider = memo(
  ({ children, ...props }: IMessageContextMenuStoreProviderProps) => {
    const storeRef = useRef<IMessageContextMenuStore>();
    if (!storeRef.current) {
      storeRef.current = createMessageContextMenuStore(props);
    }
    return (
      <MessageContextMenuStoreContext.Provider value={storeRef.current}>
        {children}
      </MessageContextMenuStoreContext.Provider>
    );
  }
);

const createMessageContextMenuStore = (
  initProps: IMessageContextMenuStoreProps
) => {
  return createStore<IMessageContextMenuStoreState>()(
    subscribeWithSelector((set) => ({
      messageContextMenuData: null,
      setMessageContextMenuData: (data) =>
        set({ messageContextMenuData: data }),
      ...initProps,
    }))
  );
};

const MessageContextMenuStoreContext =
  createContext<IMessageContextMenuStore | null>(null);

export function useMessageContextMenuStoreContext<T>(
  selector: (state: IMessageContextMenuStoreState) => T
): T {
  const store = useContext(MessageContextMenuStoreContext);
  if (!store)
    throw new Error("Missing MessageContextMenuStore.Provider in the tree");
  return useStore(store, selector);
}

export function useMessageContextMenuStore() {
  const store = useContext(MessageContextMenuStoreContext);
  if (!store)
    throw new Error(`Missing MessageContextMenuStore.Provider in the tree`);
  return store;
}
