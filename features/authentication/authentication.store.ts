import { create } from "zustand"

type IAuthStatus = "undetermined" | "onboarding" | "signedIn" | "signedOut"

export type IAuthStore = {
  status: IAuthStatus
  actions: {
    setStatus: (status: IAuthStatus) => void
  }
}

export const useAuthStore = create<IAuthStore>((set, get) => ({
  status: "undetermined",
  actions: {
    setStatus: (status) => set({ status }),
  },
}))
