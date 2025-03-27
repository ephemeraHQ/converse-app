import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

type IAuthStatus = "undetermined" | "onboarding" | "signedIn" | "signedOut"

type IAuthenticationStore = {
  status: IAuthStatus
  actions: {
    setStatus: (status: IAuthStatus) => void
  }
}

export const useAuthenticationStore = create<IAuthenticationStore>()(
  subscribeWithSelector((set, get) => ({
    status: "undetermined",
    actions: {
      setStatus: (status) => set({ status }),
    },
  })),
)
