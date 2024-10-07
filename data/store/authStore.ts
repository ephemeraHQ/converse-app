import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type IAuthStatus = "idle" | "signOut" | "signIn";

export interface IAuthStore {
  status: IAuthStatus;
}

export const useAuthStore = create<IAuthStore>()(
  subscribeWithSelector((set, get) => ({
    status: "idle",
  }))
);

export function useAuthStatus() {
  return useAuthStore((state) => state.status);
}

export function getAuthStatus() {
  return useAuthStore.getState().status;
}

export function setAuthStatus(status: IAuthStatus) {
  useAuthStore.setState({ status });
}
