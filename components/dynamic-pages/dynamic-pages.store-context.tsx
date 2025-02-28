import { createContext, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IDynamicPagesStoreProps = {};

type IDynamicPagesStoreState = IDynamicPagesStoreProps & {
  currentPageIndex: number;
  actions: {
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    reset: () => void;
  };
};

type IDynamicPagesStoreProviderProps =
  React.PropsWithChildren<IDynamicPagesStoreProps>;

type IDynamicPagesStore = ReturnType<typeof createDynamicPagesStore>;

export function DynamicPagesStoreProvider({
  children,
  ...props
}: IDynamicPagesStoreProviderProps) {
  const storeRef = useRef<IDynamicPagesStore>();

  if (!storeRef.current) {
    storeRef.current = createDynamicPagesStore(props);
  }

  return (
    <DynamicPagesStoreContext.Provider value={storeRef.current}>
      {children}
    </DynamicPagesStoreContext.Provider>
  );
}

const createDynamicPagesStore = (
  initProps: Partial<IDynamicPagesStoreProps>,
) => {
  const DEFAULT_PROPS: IDynamicPagesStoreProps = {};

  return createStore<IDynamicPagesStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    currentPageIndex: 0,
    actions: {
      goToNextPage: () => {
        set((state) => ({
          ...state,
          currentPageIndex: state.currentPageIndex + 1,
        }));
      },
      goToPreviousPage: () => {
        set((state) => ({
          ...state,
          currentPageIndex: state.currentPageIndex - 1,
        }));
      },
      reset: () => {
        set((state) => ({
          ...state,
          currentPageIndex: 0,
        }));
      },
    },
  }));
};

const DynamicPagesStoreContext = createContext<IDynamicPagesStore | null>(null);

export function useDynamicPagesStoreContext<T>(
  selector: (state: IDynamicPagesStoreState) => T,
): T {
  const store = useContext(DynamicPagesStoreContext);

  if (!store) {
    throw new Error("Missing DynamicPagesStoreProvider.Provider in the tree");
  }

  return useStore(store, selector);
}

export function useDynamicPagesStore() {
  const store = useContext(DynamicPagesStoreContext);

  if (!store) {
    throw new Error("Missing DynamicPagesStoreProvider.Provider in the tree");
  }

  return store;
}
