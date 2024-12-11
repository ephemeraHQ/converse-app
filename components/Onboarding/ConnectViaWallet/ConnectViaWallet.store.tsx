import { Signer } from "ethers";
import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IConnectViaWalletStoreProps = {
  address: string;
  alreadyV3Db: boolean;
  signer: Signer;
};

type IConnectViaWalletStoreProviderProps =
  React.PropsWithChildren<IConnectViaWalletStoreProps>;

type IConnectViaWalletStoreState = IConnectViaWalletStoreProps & {
  loading: boolean;
  numberOfSignaturesDone: number;
  waitingForNextSignature: boolean;
  clickedSignature: boolean;
  setLoading: (loading: boolean) => void;
  setNumberOfSignaturesDone: (signaturesDone: number) => void;
  setWaitingForNextSignature: (waiting: boolean) => void;
  setClickedSignature: (clickedSignature: boolean) => void;
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
    address: props.address,
    signer: props.signer,
    alreadyV3Db: props.alreadyV3Db,
    loading: false,
    numberOfSignaturesDone: 0,
    waitingForNextSignature: false,
    clickedSignature: false,
    setLoading: (loading) => set({ loading }),
    setNumberOfSignaturesDone: (signaturesDone) =>
      set({ numberOfSignaturesDone: signaturesDone }),
    setWaitingForNextSignature: (waiting) =>
      set({ waitingForNextSignature: waiting }),
    setClickedSignature: (clickedSignature) => set({ clickedSignature }),
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
