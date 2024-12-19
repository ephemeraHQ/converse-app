import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IPasskeyAuthStoreProps = {
  loading: boolean;
};

type IPasskeyAuthStoreState = IPasskeyAuthStoreProps & {
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

type IPasskeyAuthStoreProviderProps =
  React.PropsWithChildren<IPasskeyAuthStoreProps>;

type IPasskeyAuthStore = ReturnType<typeof createPasskeyAuthStore>;

const PasskeyAuthStoreContext = createContext<IPasskeyAuthStore | null>(null);

export const PasskeyAuthStoreProvider = memo(
  ({ children, ...props }: IPasskeyAuthStoreProviderProps) => {
    const storeRef = useRef<IPasskeyAuthStore>();
    if (!storeRef.current) {
      storeRef.current = createPasskeyAuthStore(props);
    }
    return (
      <PasskeyAuthStoreContext.Provider value={storeRef.current}>
        {children}
      </PasskeyAuthStoreContext.Provider>
    );
  }
);

const createPasskeyAuthStore = (initProps: IPasskeyAuthStoreProps) => {
  const DEFAULT_PROPS: IPasskeyAuthStoreProps = {
    loading: false,
  };
  return createStore<IPasskeyAuthStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setLoading: (loading) => set({ loading }),
    reset: () => set(DEFAULT_PROPS),
  }));
};

export function usePasskeyAuthStoreContext<T>(
  selector: (state: IPasskeyAuthStoreState) => T
): T {
  const store = useContext(PasskeyAuthStoreContext);
  if (!store) throw new Error("Missing PasskeyAuthStore.Provider in the tree");
  return useStore(store, selector);
}

export const usePasskeyAuthStore = () => {
  const store = useContext(PasskeyAuthStoreContext);
  if (!store) {
    throw new Error(
      "usePasskeyAuthStore must be used within a PasskeyAuthStoreProvider"
    );
  }
  return store;
};
