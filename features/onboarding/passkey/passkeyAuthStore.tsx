import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IPasskeyAuthStoreProps = {
  loading?: boolean;
  error?: string;
  statusString?: string;
  account?: string;
};

type IPasskeyAuthStoreState = IPasskeyAuthStoreProps & {
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  setStatusString: (statusString: string | undefined) => void;
  setAccount: (account: string | undefined) => void;
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
    error: undefined,
    statusString: undefined,
    account: undefined,
  };
  return createStore<IPasskeyAuthStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setLoading: (loading) =>
      loading ? set({ loading, error: undefined }) : set({ loading: false }),
    setError: (error) =>
      set({ error, statusString: undefined, loading: false }),
    setStatusString: (statusString) => set({ statusString }),
    setAccount: (account) => set({ account }),
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
