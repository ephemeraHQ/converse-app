import { create } from "zustand";

export type UserStoreType = {
  userAddress: string;
  setUserAddress: (a: string) => void;
};

export const initUserStore = () => {
  const profilesStore = create<UserStoreType>()((set) => ({
    userAddress: "",
    setUserAddress: (a) => set(() => ({ userAddress: a })),
  }));
  return profilesStore;
};
