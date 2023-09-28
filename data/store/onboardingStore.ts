import { create } from "zustand";

// A app-wide store to store the current onboarding

type OnboardingStoreType = {
  addingNewAccount: boolean;
  setAddingNewAccount: (adding: boolean) => void;

  desktopConnectSessionId: string | null;
  setDesktopConnectSessionId: (sessionId: string | null) => void;
};

export const useOnboardingStore = create<OnboardingStoreType>()((set) => ({
  addingNewAccount: false,
  setAddingNewAccount: (adding) => set(() => ({ addingNewAccount: adding })),

  desktopConnectSessionId: null,
  setDesktopConnectSessionId: (sessionId) =>
    set(() => ({ desktopConnectSessionId: sessionId })),
}));
