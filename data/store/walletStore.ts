import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { zustandMMKVStorage } from "../../utils/mmkv";

export type WalletStoreType = {
  USDCBalance: string;
  setUSDCBalance: (b: string) => void;
};

export const initWalletStore = (account: string) => {
  const profilesStore = create<WalletStoreType>()(
    persist(
      (set) => ({
        USDCBalance: "0",
        setUSDCBalance: (b) => set(() => ({ USDCBalance: b })),
      }),
      {
        name: `store-${account}-wallet`, // Account-based storage so each account can have its own wallet data
        storage: createJSONStorage(() => zustandMMKVStorage),
      }
    )
  );
  return profilesStore;
};
