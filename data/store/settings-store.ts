import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandMMKVStorage } from "@/utils/storage/zustand-storage";
import {
  currentAccountStoreHook,
  getAccountStore,
} from "@/features/authentication/account.store";

export type SettingsStoreType = {
  // We'll add state properties here later
};

export const initSettingsStore = (userId: string) => {
  const settingsStore = create<SettingsStoreType>()(
    persist(
      (set) => ({
        // We'll add state and actions here later
      }),
      {
        name: `store-${userId}-settings`,
        storage: createJSONStorage(() => zustandMMKVStorage),
        version: 1,
      }
    )
  );
  return settingsStore;
};

export const useSettingsStore = currentAccountStoreHook("settings");

export const getSettingsStore = (inboxId: string) =>
  getAccountStore(inboxId).settings;
