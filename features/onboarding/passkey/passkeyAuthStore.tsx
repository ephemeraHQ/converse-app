import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";
import { LocalAccount } from "viem/accounts";
import { TurnkeyStoreInfo } from "@/utils/passkeys/passkeys.interfaces";

type IPasskeyAuthStoreProps = {
  loading?: boolean;
  error?: string;
  statusString?: string;
  account?: LocalAccount;
  turnkeyInfo?: TurnkeyStoreInfo;
  previousPasskeyName?: string;
};

type IPasskeyAuthStoreState = IPasskeyAuthStoreProps & {
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  setStatusString: (statusString: string | undefined) => void;
  setAccount: (account: LocalAccount | undefined) => void;
  setTurnkeyInfo: (turnkeyInfo: TurnkeyStoreInfo | undefined) => void;
  setPreviousPasskeyName: (previousPasskeyName: string | undefined) => void;
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
    turnkeyInfo: undefined,
    previousPasskeyName: undefined,
  };
  return createStore<IPasskeyAuthStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setLoading: (loading) =>
      loading ? set({ loading, error: undefined }) : set({ loading: false }),
    setError: (error) => set({ error, statusString: undefined }),
    setStatusString: (statusString) => set({ statusString }),
    setAccount: (account) => set({ account }),
    setTurnkeyInfo: (turnkeyInfo) => set({ turnkeyInfo }),
    setPreviousPasskeyName: (previousPasskeyName) =>
      set({ previousPasskeyName }),
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
