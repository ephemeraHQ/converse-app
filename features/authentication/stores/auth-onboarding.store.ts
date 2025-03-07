import { create } from "zustand"

type IAuthOnboardingState = {
  isProcessingWeb3Stuff: boolean
}

type IAuthOnboardingActions = {
  setIsProcessingWeb3Stuff: (isProcessingWeb3Stuff: boolean) => void
}

type IAuthOnboardingStore = IAuthOnboardingState & {
  actions: IAuthOnboardingActions
}

const initialState: IAuthOnboardingState = {
  isProcessingWeb3Stuff: false,
}

export const useAuthOnboardingStore = create<IAuthOnboardingStore>((set, get) => ({
  ...initialState,
  actions: {
    setIsProcessingWeb3Stuff: (isProcessingWeb3Stuff) => set({ isProcessingWeb3Stuff }),
  },
}))
