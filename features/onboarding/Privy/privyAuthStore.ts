import { create } from "zustand";

interface IPrivyConnectStore {
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
}

const initialState = {
  phone: "",
  status: "enter-phone" as const,
  privyAccountId: "",
  otpCode: "",
  retrySeconds: 0,
  loading: false,
};

export const usePrivyConnectStore = create<IPrivyConnectStore>((set) => ({
  ...initialState,
  setPhone: (phone) => set({ phone }),
  setStatus: (status) => set({ status }),
  setPrivyAccountId: (privyAccountId) => set({ privyAccountId }),
  setOtpCode: (otpCode) => set({ otpCode }),
  setRetrySeconds: (retrySeconds) => set({ retrySeconds }),
  setLoading: (loading) => set({ loading }),
  reset: () => set(initialState),
}));
