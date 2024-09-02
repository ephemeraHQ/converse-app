import { Signer } from "ethers";
import { create } from "zustand";

// A app-wide store to store the current onboarding

export type ConnectionMethod =
  | undefined
  | "wallet"
  | "phone"
  | "desktop"
  | "privateKey"
  | "ephemeral";

export type OnboardingStep = "login" | "invite";

type OnboardingStoreType = {
  addingNewAccount: boolean;
  setAddingNewAccount: (adding: boolean) => void;

  desktopConnectSessionId: string | null;
  setDesktopConnectSessionId: (sessionId: string | null) => void;

  connectionMethod: ConnectionMethod;
  setConnectionMethod: (method: ConnectionMethod) => void;

  signer: Signer | undefined;
  address: string | undefined;
  setSigner: (s: Signer | undefined) => void;

  loading: boolean;
  setLoading: (l: boolean) => void;

  isEphemeral: boolean;
  setIsEphemeral: (e: boolean) => void;

  privyAccountId: string | undefined;
  setPrivyAccountId: (id: string | undefined) => void;

  privyAccessToken: string | undefined;
  setPrivyAccessToken: (token: string | undefined) => void;

  inviteCode: string;
  setInviteCode: (i: string) => void;

  pkPath: string | undefined;
  setPkPath: (p: string) => void;

  resetOnboarding: () => void;

  step: OnboardingStep;
  setStep: (s: OnboardingStep) => void;
};

export const useOnboardingStore = create<OnboardingStoreType>()((set) => ({
  addingNewAccount: false,
  setAddingNewAccount: (adding) => set(() => ({ addingNewAccount: adding })),

  desktopConnectSessionId: null,
  setDesktopConnectSessionId: (sessionId) =>
    set(() => ({
      desktopConnectSessionId: sessionId,
      addingNewAccount: !!sessionId,
    })),

  connectionMethod: undefined,
  setConnectionMethod: (method) =>
    set(() => ({
      connectionMethod: method,
    })),

  signer: undefined,
  address: undefined,
  setSigner: async (s) => {
    let address = undefined as string | undefined;
    if (s) {
      address = await s.getAddress();
    }
    return set(() => ({
      signer: s,
      address,
    }));
  },

  loading: false,
  setLoading: (l) =>
    set(() => ({
      loading: l,
    })),

  isEphemeral: false,
  setIsEphemeral: (e) =>
    set(() => ({
      isEphemeral: e,
    })),

  privyAccountId: undefined,
  setPrivyAccountId: (id) => set(() => ({ privyAccountId: id })),

  privyAccessToken: undefined,
  setPrivyAccessToken: (token) => set(() => ({ privyAccessToken: token })),

  pkPath: undefined,
  setPkPath: (p) => set(() => ({ pkPath: p })),

  inviteCode: "",
  setInviteCode: (i) => set(() => ({ inviteCode: i })),

  step: "login",
  setStep: (s: OnboardingStep) => set(() => ({ step: s })),

  resetOnboarding: () =>
    set(() => ({
      addingNewAccount: false,
      desktopConnectSessionId: null,
      connectionMethod: undefined,
      signer: undefined,
      address: undefined,
      loading: false,
      isEphemeral: false,
      privyAccountId: undefined,
      pkPath: undefined,
      step: "login",
      inviteCode: "",
      socials: undefined,
      profile: {
        username: "",
        displayName: "",
        avatar: "",
      },
    })),
}));
