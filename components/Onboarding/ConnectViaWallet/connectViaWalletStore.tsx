import { Signer } from "ethers";
import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IConnectViaWalletStoreProps = object;

type IConnectViaWalletStoreProviderProps =
  React.PropsWithChildren<IConnectViaWalletStoreProps>;

type IConnectViaWalletStoreState = {
  signer: Signer | undefined;
  address: string | undefined;
  loading: boolean;
  signaturesDone: number;
  waitingForNextSignature: boolean;
  onXmtp: boolean;
  alreadyV3Db: boolean;
  setSigner: (signer: Signer | undefined) => void;
  setAddress: (address: string | undefined) => void;
  setLoading: (loading: boolean) => void;
  setSignaturesDone: (signaturesDone: number) => void;
  setWaitingForNextSignature: (waiting: boolean) => void;
  setOnXmtp: (onXmtp: boolean) => void;
  setAlreadyV3Db: (alreadyV3Db: boolean) => void;
  resetOnboarding: () => void;
};

type IConnectViaWalletStore = ReturnType<typeof createConnectViaWalletStore>;

export const ConnectViaWalletStoreProvider = memo(
  ({ children, ...props }: IConnectViaWalletStoreProviderProps) => {
    const storeRef = useRef<IConnectViaWalletStore>();
    if (!storeRef.current) {
      storeRef.current = createConnectViaWalletStore();
    }
    return (
      <ConnectViaWalletStoreContext.Provider value={storeRef.current}>
        {children}
      </ConnectViaWalletStoreContext.Provider>
    );
  }
);

const createConnectViaWalletStore = () =>
  createStore<IConnectViaWalletStoreState>()((set) => ({
    signer: undefined,
    address: undefined,
    loading: false,
    signaturesDone: 0,
    waitingForNextSignature: false,
    onXmtp: false,
    alreadyV3Db: false,
    setSigner: (signer) => set({ signer }),
    setAddress: (address) => set({ address }),
    setLoading: (loading) => set({ loading }),
    setSignaturesDone: (signaturesDone) => set({ signaturesDone }),
    setWaitingForNextSignature: (waiting) =>
      set({ waitingForNextSignature: waiting }),
    setOnXmtp: (onXmtp) => set({ onXmtp }),
    setAlreadyV3Db: (alreadyV3Db) => set({ alreadyV3Db }),
    resetOnboarding: () =>
      set({
        signer: undefined,
        address: undefined,
        loading: false,
        signaturesDone: 0,
        waitingForNextSignature: false,
        onXmtp: false,
        alreadyV3Db: false,
      }),
  }));

const ConnectViaWalletStoreContext =
  createContext<IConnectViaWalletStore | null>(null);

export function useConnectViaWalletStoreContext<T>(
  selector: (state: IConnectViaWalletStoreState) => T
): T {
  const store = useContext(ConnectViaWalletStoreContext);
  if (!store)
    throw new Error("Missing ConnectViaWalletStore.Provider in the tree");
  return useStore(store, selector);
}

export function useConnectViaWalletStore() {
  const store = useContext(ConnectViaWalletStoreContext);
  if (!store) throw new Error();
  return store;
}
