import { create } from "zustand"

type IAuthStatus = "undetermined" | "onboarding" | "signedIn" | "signedOut"

type IAuthenticationStore = {
  status: IAuthStatus
  actions: {
    setStatus: (status: IAuthStatus) => void
  }
}

export const useAuthenticationStore = create<IAuthenticationStore>((set, get) => ({
  status: "undetermined",
  actions: {
    setStatus: (status) => set({ status }),
  },
}))
