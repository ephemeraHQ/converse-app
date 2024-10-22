import { Signer } from "ethers";
import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IConnectViaWalletStoreProps = {
  signer: Signer;
};

type IConnectViaWalletStoreProviderProps =
  React.PropsWithChildren<IConnectViaWalletStoreProps>;

type IConnectViaWalletStoreState = IConnectViaWalletStoreProps & {
  address: string | undefined;
  loading: boolean;
  signaturesDone: number;
  waitingForNextSignature: boolean;
  onXmtp: boolean;
  alreadyV3Db: boolean;
  clickedSignature: boolean;
  initiatingClientForAddress: string | undefined;
  setAddress: (address: string | undefined) => void;
  setLoading: (loading: boolean) => void;
  setSignaturesDone: (signaturesDone: number) => void;
  setWaitingForNextSignature: (waiting: boolean) => void;
  setOnXmtp: (onXmtp: boolean) => void;
  setAlreadyV3Db: (alreadyV3Db: boolean) => void;
  setClickedSignature: (clickedSignature: boolean) => void;
  setInitiatingClientForAddress: (
    initiatingClientForAddress: string | undefined
  ) => void;
};

type IConnectViaWalletStore = ReturnType<typeof createConnectViaWalletStore>;

export const ConnectViaWalletStoreProvider = memo(
  ({ children, ...props }: IConnectViaWalletStoreProviderProps) => {
    const storeRef = useRef<IConnectViaWalletStore>();
    if (!storeRef.current) {
      storeRef.current = createConnectViaWalletStore(props);
    }
    return (
      <ConnectViaWalletStoreContext.Provider value={storeRef.current}>
        {children}
      </ConnectViaWalletStoreContext.Provider>
    );
  }
);

const createConnectViaWalletStore = (props: IConnectViaWalletStoreProps) =>
  createStore<IConnectViaWalletStoreState>()((set) => ({
    signer: props.signer,
    address: undefined,
    loading: false,
    signaturesDone: 0,
    waitingForNextSignature: false,
    onXmtp: false,
    alreadyV3Db: false,
    clickedSignature: false,
    initiatingClientForAddress: undefined,
    setAddress: (address) => set({ address }),
    setLoading: (loading) => set({ loading }),
    setSignaturesDone: (signaturesDone) => set({ signaturesDone }),
    setWaitingForNextSignature: (waiting) =>
      set({ waitingForNextSignature: waiting }),
    setOnXmtp: (onXmtp) => set({ onXmtp }),
    setAlreadyV3Db: (alreadyV3Db) => set({ alreadyV3Db }),
    setClickedSignature: (clickedSignature) => set({ clickedSignature }),
    setInitiatingClientForAddress: (initiatingClientForAddress) =>
      set({ initiatingClientForAddress }),
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
