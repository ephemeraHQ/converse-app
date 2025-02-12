import { create } from "zustand";

type IAuthStatus = "idle" | "signedIn" | "signedOut";

export type IAuthStore = {
  status: IAuthStatus;
  actions: {
    setStatus: (status: IAuthStatus) => void;
  };
};

export const useAuthStore = create<IAuthStore>((set, get) => ({
  status: "idle",
  actions: {
    setStatus: (status) => set({ status }),
  },
}));
