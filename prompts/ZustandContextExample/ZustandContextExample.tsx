import { createContext, useContext, useRef, memo } from "react";
import { createStore, useStore } from "zustand";

type IZustandStoreProps = object;

type IZustandStoreState = IZustandStoreProps & object;

type IZustandStoreProviderProps = React.PropsWithChildren<IZustandStoreProps>;

type IZustandStore = ReturnType<typeof createZustandStore>;

const ZustandStoreProvider = memo(
  ({ children, ...props }: IZustandStoreProviderProps) => {
    const storeRef = useRef<IZustandStore>();
    if (!storeRef.current) {
      storeRef.current = createZustandStore(props);
    }
    return (
      <ZustandStoreContext.Provider value={storeRef.current}>
        {children}
      </ZustandStoreContext.Provider>
    );
  }
);

const createZustandStore = (initProps: IZustandStoreProps) => {
  const DEFAULT_PROPS: IZustandStoreProps = {};
  return createStore<IZustandStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
  }));
};

const ZustandStoreContext = createContext<IZustandStore | null>(null);

function useZustandStoreContext<T>(
  selector: (state: IZustandStoreState) => T
): T {
  const store = useContext(ZustandStoreContext);
  if (!store) throw new Error("Missing ZustandStore.Provider in the tree");
  return useStore(store, selector);
}

function useZustandStore() {
  const store = useContext(ZustandStoreContext);
  if (!store) throw new Error();
  return store;
}
