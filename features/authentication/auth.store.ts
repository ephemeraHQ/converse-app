import { CurrentSender } from "@/features/multi-inbox/multi-inbox-client.types";
import { create } from "zustand";

type IAuthStatus = "idle" | "signedIn" | "signedOut";

export type IAuthStore = {
  status: IAuthStatus;
  currentSender: CurrentSender | undefined;
  actions: {
    setStatus: (status: IAuthStatus) => void;
    setCurrentSender: (sender: CurrentSender | undefined) => void;
  };
};

export const useAuthStore = create<IAuthStore>((set, get) => ({
  status: "idle",
  currentSender: undefined,
  actions: {
    setStatus: (status) => set({ status }),
    setCurrentSender: (sender) => set({ currentSender: sender }),
  },
}));
