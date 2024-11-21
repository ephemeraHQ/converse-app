import { createContext, memo, useContext, useEffect, useRef } from "react";
import { createStore, useStore } from "zustand";

type IMessageContextStoreProps = {
  hasNextMessageInSeries: boolean;
  fromMe: boolean;
};

type IMessageContextStoreState = IMessageContextStoreProps & {};

type IMessageContextStoreProviderProps =
  React.PropsWithChildren<IMessageContextStoreProps>;

type IMessageContextStore = ReturnType<typeof createMessageContextStore>;

export const MessageContextStoreProvider = memo(
  ({ children, ...props }: IMessageContextStoreProviderProps) => {
    const storeRef = useRef<IMessageContextStore>();
    if (!storeRef.current) {
      storeRef.current = createMessageContextStore(props);
    }

    useEffect(() => {
      // TODO: Check if the props have made something change in the store?
      storeRef.current?.setState(props);
    }, [props]);

    return (
      <MessageContextStoreContext.Provider value={storeRef.current}>
        {children}
      </MessageContextStoreContext.Provider>
    );
  }
);

const createMessageContextStore = (initProps: IMessageContextStoreProps) => {
  const DEFAULT_PROPS: IMessageContextStoreProps = {
    hasNextMessageInSeries: false,
    fromMe: false,
  };
  return createStore<IMessageContextStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
  }));
};

const MessageContextStoreContext = createContext<IMessageContextStore | null>(
  null
);

export function useMessageContextStoreContext<T>(
  selector: (state: IMessageContextStoreState) => T
): T {
  const store = useContext(MessageContextStoreContext);
  if (!store)
    throw new Error("Missing MessageContextStore.Provider in the tree");
  return useStore(store, selector);
}

function useMessageContextStore() {
  const store = useContext(MessageContextStoreContext);
  if (!store) throw new Error();
  return store;
}
