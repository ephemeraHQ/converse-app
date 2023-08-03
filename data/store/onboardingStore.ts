import { create } from "zustand";

// A app-wide store to store the current onboarding

type OnboardingStoreType = {
  desktopConnectSessionId: string | null;
  setDesktopConnectSessionId: (sessionId: string | null) => void;
};

export const useOnboardingStore = create<OnboardingStoreType>()((set) => ({
  desktopConnectSessionId: null,
  setDesktopConnectSessionId: (sessionId) =>
    set(() => ({ desktopConnectSessionId: sessionId })),
}));
