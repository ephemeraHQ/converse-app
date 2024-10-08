import { createContext, memo, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

type IPrivyAuthStoreProps = {
  phone?: string;
  status?: "enter-phone" | "verify-phone";
  privyAccountId?: string;
  otpCode?: string;
  retrySeconds?: number;
  loading?: boolean;
};

type IPrivyAuthStoreState = {
  phone: string;
  status: "enter-phone" | "verify-phone";
  privyAccountId: string;
  otpCode: string;
  retrySeconds: number;
  loading: boolean;
  setPhone: (phone: string) => void;
  setStatus: (status: "enter-phone" | "verify-phone") => void;
  setPrivyAccountId: (id: string) => void;
  setOtpCode: (code: string) => void;
  setRetrySeconds: (seconds: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

type IPrivyAuthStoreProviderProps =
  React.PropsWithChildren<IPrivyAuthStoreProps>;

type IPrivyAuthStore = ReturnType<typeof createPrivyAuthStore>;

const PrivyAuthStoreContext = createContext<IPrivyAuthStore | null>(null);

export const PrivyAuthStoreProvider = memo(
  ({ children, ...props }: IPrivyAuthStoreProviderProps) => {
    const storeRef = useRef<IPrivyAuthStore>();
    if (!storeRef.current) {
      storeRef.current = createPrivyAuthStore(props);
    }
    return (
      <PrivyAuthStoreContext.Provider value={storeRef.current}>
        {children}
      </PrivyAuthStoreContext.Provider>
    );
  }
);

const createPrivyAuthStore = (initProps: IPrivyAuthStoreProps) => {
  const DEFAULT_PROPS: IPrivyAuthStoreState = {
    phone: "",
    status: "enter-phone",
    privyAccountId: "",
    otpCode: "",
    retrySeconds: 0,
    loading: false,
  };
  return createStore<IPrivyAuthStoreState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setPhone: (phone) => set({ phone }),
    setStatus: (status) => set({ status }),
    setPrivyAccountId: (privyAccountId) => set({ privyAccountId }),
    setOtpCode: (otpCode) => set({ otpCode }),
    setRetrySeconds: (retrySeconds) => set({ retrySeconds }),
    setLoading: (loading) => set({ loading }),
    reset: () => set(DEFAULT_PROPS),
  }));
};

export function usePrivyAuthStoreContext<T>(
  selector: (state: IPrivyAuthStoreState) => T
): T {
  const store = useContext(PrivyAuthStoreContext);
  if (!store) throw new Error("Missing PrivyAuthStore.Provider in the tree");
  return useStore(store, selector);
}

export function usePrivyAuthStore() {
  const store = useContext(PrivyAuthStoreContext);
  if (!store) throw new Error("Missing PrivyAuthStore.Provider in the tree");
  return store;
}
