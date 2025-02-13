import { create } from "zustand";

export const AuthStatuses = {
  undetermined: "undetermined",
  signedIn: "signedIn",
  signedOut: "signedOut",
  signingIn: "signingIn",
  signingUp: "signingUp",
} as const;

type IAuthStatus = (typeof AuthStatuses)[keyof typeof AuthStatuses];

export type IAuthStore = {
  status: IAuthStatus;
  actions: {
    setStatus: (status: IAuthStatus) => void;
  };
};

export const useAuthStore = create<IAuthStore>((set, get) => ({
  status: AuthStatuses.undetermined,
  actions: {
    setStatus: (status) => set({ status }),
  },
}));
